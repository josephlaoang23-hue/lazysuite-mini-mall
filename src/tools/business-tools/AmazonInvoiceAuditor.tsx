import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.amazoninvoiceauditor;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface ChecklistItem {
  field: string;
  status: "present" | "missing" | "unclear";
  note: string;
}

interface AuditResult {
  summary: string;
  checklist: ChecklistItem[];
}

export default function AmazonInvoiceAuditor({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setResult(null);
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
You are an e-commerce operations assistant that checks a supplier invoice image against standard commercial invoice field requirements.

Return ONLY valid JSON matching this exact shape, no markdown fences, no explanation:

{
  "summary": "2-3 sentence plain-language summary of the invoice's overall completeness",
  "checklist": [
    {
      "field": "Field name, e.g. 'Seller Name & Address', 'Invoice Number', 'Invoice Date', 'Itemized SKUs/Quantities', 'Unit Price & Currency', 'Buyer Name & Address', 'Total Amount'",
      "status": "present" | "missing" | "unclear",
      "note": "1 sentence noting what was found or what's missing/unclear"
    }
  ]
}

Rules:
- Check against standard commercial invoice fields only. Do not claim certainty about current Amazon-specific policy requirements, since those can change — note in the summary that sellers should confirm current requirements against official Amazon Seller Central guidelines before submitting.
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

  const runAudit = async () => {
    if (!imageFile) return;
    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setResult(null);

    triggerProcess("Checking your supplier invoice for missing fields...", async () => {
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
            toolId: "amazoninvoiceauditor"
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));

        if (response.status === 202) {
          onRequestUnlimited(promptText, "[invoice uploaded]", handleAiOutput);
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

  const statusColor: Record<string, string> = {
    present: "#34d399",
    missing: "#f87171",
    unclear: "#fbbf24"
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
          <h2 className="tool-header-title">Supplier Invoice Field Checker</h2>
          <p className="tool-header-seo">
            Upload your factory's invoice — check it against standard commercial invoice fields before submitting.
          </p>
          <p className="a11y-disclaimer">
            ⚠️ This checks against general commercial invoice standards, not a live copy of Amazon's current policy. Always confirm against the latest official Amazon Seller Central guidelines before submitting.
          </p>

          <RunsBadge remainingRuns={remainingRuns} />

          <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleInputChange} className="repo-file-input-hidden" />
          <div className="pdf-drop-zone" onClick={() => fileInputRef.current?.click()}>
            <p className="repo-drop-text">{imageFile ? `✓ ${imageFile.name}` : "Click to upload your supplier invoice"}</p>
          </div>

          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}

          <button
            onClick={runAudit}
            disabled={!imageFile || isLoading}
            className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
          >
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Checking Invoice..." : "Check Invoice Fields"}
          </button>

          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Catch missing invoice fields before Amazon does</h2>
            <p>A single missing field on a supplier invoice can freeze an Amazon listing within 24 hours. This tool gives FBA sellers a quick pre-check against standard commercial invoice requirements, flagging what's missing before submission.</p>
          </section>
        </>
      }
      canvas={
        result ? (
          <div className="output-box">
            <p style={{ marginBottom: "12px" }}>{result.summary}</p>
            {result.checklist.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #1e293b", fontSize: "12px" }}>
                <div>
                  <div>{item.field}</div>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>{item.note}</div>
                </div>
                <span style={{ color: statusColor[item.status], fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", whiteSpace: "nowrap" }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
            Your invoice field checklist will appear here.
          </p>
        )
    }
    />
    </>
  );
}