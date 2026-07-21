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

interface AppraisalResult {
  itemName: string;
  estimatedEraOrModel: string;
  conditionAssessment: string;
  estimatedValueRange: string;
  ebayListingTitle: string;
  ebayListingDescription: string;
}

export default function ThriftAppraisalGrid({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AppraisalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setResult(null);
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
You are a vintage and antique resale expert who evaluates secondhand items from photos.

Look at this item (or manufacturer hallmark/stamp) and return ONLY valid JSON matching this exact shape, no markdown fences, no explanation:

{
  "itemName": "Best guess at what this item is",
  "estimatedEraOrModel": "Best guess at era/model/maker based on visible design cues",
  "conditionAssessment": "1-2 sentence honest visual condition assessment based on visible wear",
  "estimatedValueRange": "A rough resale price range, e.g. '$25–$60', clearly labeled as an estimate",
  "ebayListingTitle": "A high-converting eBay-style listing title under 80 characters",
  "ebayListingDescription": "A 3-4 sentence eBay listing description highlighting key selling points"
}

Rules:
- Be honest that this is a visual estimate, not an appraisal — do not claim certainty about maker, year, or exact value.
- If the item is unclear or unidentifiable, say so honestly in itemName and give your best general category guess.
- Output ONLY the raw JSON object.
`;

  const handleAiOutput = (rawOutput: string) => {
    const cleaned = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      setResult(JSON.parse(cleaned));
    } catch (err) {
      console.error("JSON parse failed:", err, cleaned);
      setErrorMsg("The AI's response wasn't in the expected format. Please try again.");
    }
  };

  const generateAppraisal = async () => {
    if (!imageFile) return;
    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setResult(null);

    triggerProcess("Examining your item and estimating its resale value...", async () => {
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
            toolId: "thriftappraisal"
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

  const copyListing = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(`${result.ebayListingTitle}\n\n${result.ebayListingDescription}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      controls={
        <>
          <h2 className="tool-header-title">Visual Thrift Appraisal Grid</h2>
          <p className="tool-header-seo">
            Snap a photo of a vintage item — get an estimated value range and a ready-to-use eBay listing draft.
          </p>
          <p className="a11y-disclaimer">
            This is a rough visual estimate based on appearance only, not a certified appraisal. Verify pricing against real completed listings before selling.
          </p>

          <RunsBadge remainingRuns={remainingRuns} />

          {!imageFile ? (
            <div className="pdf-drop-zone" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleInputChange} className="repo-file-input-hidden" />
              <p className="repo-drop-text">Drag & drop a photo of your item or its maker's stamp, or click to browse</p>
            </div>
          ) : (
            <div className="pdf-file-card">
              <span className="audio-file-name">✓ {imageFile.name}</span>
              <button className="copy-button" onClick={() => { setImageFile(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Remove</button>
            </div>
          )}

          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}

          <button
            onClick={generateAppraisal}
            disabled={!imageFile || isLoading}
            className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
          >
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Appraising..." : "Get Appraisal & Listing Draft"}
          </button>

          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Stop guessing what your vintage finds are worth</h2>
            <p>Estate liquidators and resellers sort through hundreds of items a week. This tool gives you an instant visual estimate of era, condition, and resale value range, plus a ready-to-paste eBay title and description — cutting research time from minutes to seconds per item.</p>
          </section>
        </>
      }
      canvas={
        result ? (
          <>
            {imagePreviewUrl && (
              <div style={{ marginBottom: "16px", borderRadius: "8px", overflow: "hidden", border: "1px solid #1e293b" }}>
                <img src={imagePreviewUrl} alt="Uploaded item" style={{ width: "100%", display: "block" }} />
              </div>
            )}
            <div className="output-box">
              <div style={{ marginBottom: "10px" }}><strong>{result.itemName}</strong></div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>Era/Model: {result.estimatedEraOrModel}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>Condition: {result.conditionAssessment}</div>
              <div style={{ fontSize: "16px", color: "#2dd4bf", fontWeight: "bold", marginBottom: "16px" }}>Estimated Value: {result.estimatedValueRange}</div>
              <div style={{ position: "relative", padding: "12px", backgroundColor: "#020617", borderRadius: "8px" }}>
                <button className="copy-button" onClick={copyListing} style={{ position: "absolute", top: "8px", right: "8px" }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{result.ebayListingTitle}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{result.ebayListingDescription}</div>
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
            Your appraisal and eBay listing draft will appear here.
          </p>
        )
      }
    />
  );
}