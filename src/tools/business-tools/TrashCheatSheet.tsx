import { useState, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.trashcheatsheet;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface PickupCard {
  guestNote: string;
  scheduleItems: { day: string; type: string; icon: string }[];
}

export default function TrashCheatSheet({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [card, setCard] = useState<PickupCard | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setCard(null);
    setErrorMsg("");
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const promptText = `
You are an assistant that reads a municipal trash/recycling pickup calendar screenshot and turns it into a simple guest-friendly cheat sheet.

Return ONLY valid JSON matching this exact shape, no markdown fences, no explanation:

{
  "guestNote": "1-2 sentence friendly note to guests about putting bins out",
  "scheduleItems": [
    { "day": "e.g. Every Tuesday", "type": "e.g. Trash / Recycling / Yard Waste", "icon": "one relevant emoji" }
  ]
}

Rules:
- Only use dates/schedules actually visible in the image. Do not invent a schedule if the image is unclear — instead return an empty scheduleItems array and explain in guestNote.
- Keep entries short and scannable.
- Output ONLY the raw JSON object.
`;

  const handleAiOutput = (rawOutput: string) => {
    const cleaned = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      setCard(JSON.parse(cleaned));
    } catch (err) {
      console.error("JSON parse failed:", err, cleaned);
      setErrorMsg("The AI's response wasn't in the expected format. Please try again.");
    }
  };

  const generateCard = async () => {
    if (!imageFile) return;
    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setCard(null);

    triggerProcess("Reading your trash calendar and building a guest cheat sheet...", async () => {
      setIsLoading(true);
      try {
        const imageBase64 = await fileToBase64(imageFile);

        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions: promptText,
            imageBase64,
            mimeType: imageFile.type,
            toolId: "trashcheatsheet"
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));

        if (response.status === 202) {
          onRequestUnlimited(promptText, "[image uploaded]", handleAiOutput);
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong. Please try again.");
          return;
        }

        handleAiOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  const copyCard = async () => {
    if (!card) return;
    const text = `${card.guestNote}\n\n${card.scheduleItems.map(i => `${i.icon} ${i.day} — ${i.type}`).join("\n")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
      </Helmet>

    <ToolLayout
      controls={
        <>
          <h2 className="tool-header-title">Guest Trash & Checkout Cheat Sheet Maker</h2>
          <p className="tool-header-seo">
            Upload a screenshot of your city's trash calendar — get a clean card to text your guests.
          </p>

          <RunsBadge remainingRuns={remainingRuns} />

          {!imageFile ? (
            <div className="pdf-drop-zone" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleInputChange} className="repo-file-input-hidden" />
              <p className="repo-drop-text">Drag & drop your city's trash calendar screenshot, or click to browse</p>
            </div>
          ) : (
            <div className="pdf-file-card">
              <span className="audio-file-name">✓ {imageFile.name}</span>
              <button className="copy-button" onClick={() => { setImageFile(null); setCard(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Remove</button>
            </div>
          )}

          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}

          <button
            onClick={generateCard}
            disabled={!imageFile || isLoading}
            className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
          >
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Building Cheat Sheet..." : "Generate Guest Cheat Sheet"}
          </button>

          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Never let a guest miss trash day again</h2>
            <p>Municipal trash and recycling schedules are often buried in confusing city PDFs or webpages. This tool reads a screenshot of your local calendar and turns it into a simple, scannable card you can text directly to guests — cutting down on missed pickups and city fines.</p>
          </section>
        </>
      }
      canvas={
        card ? (
          <div className="output-box" style={{ position: "relative" }}>
            <button className="copy-button" onClick={copyCard} style={{ position: "absolute", top: "12px", right: "12px" }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <p style={{ marginBottom: "12px" }}>{card.guestNote}</p>
            {card.scheduleItems.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                <span>{item.icon} {item.day}</span>
                <span style={{ color: "#94a3b8" }}>{item.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
            Your guest cheat sheet card will appear here.
          </p>
        )
    }
    />
    </>
  );
}