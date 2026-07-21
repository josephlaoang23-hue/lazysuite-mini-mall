import { useState, useRef } from "react";
import { Copy, Check } from "lucide-react";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface EstimateDraft {
  vehicleInfo: string;
  lineItems: LineItem[];
  liabilityDisclaimer: string;
}

export default function RoadsideEstimateProofer({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<EstimateDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setDraft(null);
      setErrorMsg("");
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const promptText = `
You are a professional automotive service writer who converts a mechanic's messy shorthand notes and a photo of a car repair into a formal roadside estimate draft.

Return ONLY valid JSON matching this exact shape, no markdown fences, no explanation:

{
  "vehicleInfo": "Cleaned up vehicle description, e.g. '2018 Dodge Ram 1500'",
  "lineItems": [
    { "description": "Clear professional description of a parts or labor item", "quantity": 1, "unitPrice": 250 }
  ],
  "liabilityDisclaimer": "A short, standard liability disclaimer sentence for roadside estimates"
}

Rules:
- Extract line items and their raw dollar amounts from the notes exactly as given — do NOT calculate totals or taxes yourself, only extract quantity and unitPrice per item.
- Clean up spelling and make descriptions sound professional.
- Output ONLY the raw JSON object.
`;

  const handleAiOutput = (rawOutput: string) => {
    const cleaned = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      setDraft(JSON.parse(cleaned));
    } catch (err) {
      console.error("JSON parse failed:", err, cleaned);
      setErrorMsg("The AI's response wasn't in the expected format. Please try again.");
    }
  };

  const generateEstimate = async () => {
    if (!imageFile || !notes.trim()) return;
    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setDraft(null);

    triggerProcess("Formatting your estimate...", async () => {
      setIsLoading(true);
      try {
        const imageBase64 = await fileToBase64(imageFile);

        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions: `${promptText}\n\nMechanic's raw notes:\n${notes}`,
            imageBase64,
            mimeType: imageFile.type,
            toolId: "roadsideestimate"
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));

        if (response.status === 202) {
          onRequestUnlimited(promptText, notes, handleAiOutput);
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

  // Real math, calculated in JS — not trusted to the AI
  const lineTotal = (item: LineItem) => item.quantity * item.unitPrice;
  const grandTotal = draft ? draft.lineItems.reduce((sum, i) => sum + lineTotal(i), 0) : 0;

  const copyEstimate = async () => {
    if (!draft) return;
    const text = `Roadside Service Estimate\nVehicle: ${draft.vehicleInfo}\n\n` +
      draft.lineItems.map(i => `${i.description} — Qty ${i.quantity} x $${i.unitPrice.toFixed(2)} = $${lineTotal(i).toFixed(2)}`).join("\n") +
      `\n\nTotal: $${grandTotal.toFixed(2)}\n\n${draft.liabilityDisclaimer}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      controls={
        <>
          <h2 className="tool-header-title">Roadside Estimate Proofer</h2>
          <p className="tool-header-seo">
            Snap a photo, type your rough notes — get a professional estimate draft in seconds.
          </p>

          <RunsBadge remainingRuns={remainingRuns} />

          <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleInputChange} className="repo-file-input-hidden" />
          <div className="pdf-drop-zone" onClick={() => fileInputRef.current?.click()}>
            <p className="repo-drop-text">{imageFile ? `✓ ${imageFile.name}` : "Click to upload a photo of the repair"}</p>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. fixed alternator, dodge ram 2018, 250 for parts, 150 labor"
            className="textarea-input"
            style={{ marginTop: "12px", height: "80px" }}
          />

          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}

          <button
            onClick={generateEstimate}
            disabled={!imageFile || !notes.trim() || isLoading}
            className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
          >
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Drafting Estimate..." : "Generate Estimate Draft"}
          </button>

          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Look professional from the side of the road</h2>
            <p>Mobile mechanics lose deals to corporate shops over messy texted estimates. This tool turns a quick photo and a rough shorthand note into a clean, itemized estimate draft you can send straight to a client — with totals calculated accurately, not guessed.</p>
          </section>
        </>
      }
      canvas={
        draft ? (
          <div className="output-box" style={{ position: "relative" }}>
            <button className="copy-button" onClick={copyEstimate} style={{ position: "absolute", top: "12px", right: "12px" }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <div style={{ marginBottom: "12px", fontWeight: "bold" }}>Vehicle: {draft.vehicleInfo}</div>
            {draft.lineItems.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b", fontSize: "12px" }}>
                <span>{item.description} (x{item.quantity})</span>
                <span>${lineTotal(item).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontWeight: "bold", color: "#2dd4bf" }}>
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: "10px", color: "#64748b", marginTop: "8px" }}>{draft.liabilityDisclaimer}</p>
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
            Your formatted estimate will appear here.
          </p>
        )
      }
    />
  );
}