import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.utilitybillanalyzer;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a consumer bill literacy assistant. Analyze this utility bill photo (electric/water/internet/mobile). Extract every charge, explain each line item in plain language, flag unusual or recurring fees, summarize the total, and draft polite questions/a dispute template the customer could send the provider.
This is educational only — do not assert whether any charge is legally valid or illegal, just help the user understand and ask informed questions.`;

export default function UtilityBillAnalyzer({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
  });

  const handleAnalyze = async () => {
    if (!imageFile) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");
    triggerProcess("Reading your bill and breaking down each charge...", async () => {
      setIsLoading(true);
      try {
        const imageBase64 = await fileToBase64(imageFile);
        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, imageBase64, mimeType: imageFile.type, toolId: "utilitybillanalyzer" })
        });
        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));
        if (response.status === 202) { onRequestUnlimited(PROMPT, "[bill uploaded]", setOutput); return; }
        const data = await response.json();
        if (!response.ok) { setErrorMsg(data.message || "Something went wrong."); return; }
        setOutput(data.output);
      } catch (e) { console.error(e); setErrorMsg("Something went wrong."); }
      finally { setIsLoading(false); }
    });
  };

  return (
    <>
      <Helmet><title>{seo.title}</title><meta name="description" content={seo.description} /><link rel="canonical" href={seo.canonical} /></Helmet>
      <ToolLayout
        controls={<>
          <h2 className="tool-header-title">Utility Bill Analyzer</h2>
          <p className="tool-header-seo">Upload a photo of your bill — understand every charge and get a dispute template.</p>
          <p className="a11y-disclaimer">Educational only — this doesn't determine whether a charge is legally valid.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="repo-file-input-hidden" />
          <div className="pdf-drop-zone" onClick={() => fileInputRef.current?.click()}>
            <p className="repo-drop-text">{imageFile ? `✓ ${imageFile.name}` : "Click to upload a photo of your bill"}</p>
          </div>
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleAnalyze} disabled={!imageFile || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Analyzing..." : "Analyze Bill"}
          </button>
          <AdsterraNativeBanner />
        </>}
        canvas={output ? <div className="output-box" style={{ whiteSpace: "pre-wrap" }}>{output}</div> : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your bill breakdown will appear here.</p>}
      />
    </>
  );
}