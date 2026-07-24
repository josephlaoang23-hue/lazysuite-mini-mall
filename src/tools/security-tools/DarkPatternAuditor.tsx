import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.darkpatternauditor;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a UX ethics researcher. Analyze this screenshot of a checkout flow or app for deceptive UX ("dark patterns"): hidden subscription checkboxes, fake urgency countdowns, misleading button hierarchy, forced continuity, disguised ads, confirm-shaming, hard-to-find cancellation.
Return Markdown: ### Patterns Detected (bullet each, explain why manipulative) ### Transparency Score (X/10, brief reasoning). Do not declare anything illegal — describe UX ethics only.`;

export default function DarkPatternAuditor({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
  });

  const handleAudit = async () => {
    if (!imageFile) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");
    triggerProcess("Scanning for deceptive UX patterns...", async () => {
      setIsLoading(true);
      try {
        const imageBase64 = await fileToBase64(imageFile);
        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, imageBase64, mimeType: imageFile.type, toolId: "darkpatternauditor" })
        });
        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));
        if (response.status === 202) { onRequestUnlimited(PROMPT, "[screenshot uploaded]", setOutput); return; }
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
          <h2 className="tool-header-title">Dark Pattern UX Auditor</h2>
          <p className="tool-header-seo">Upload a checkout or app screenshot — spot deceptive UX patterns.</p>
          <p className="a11y-disclaimer">Screenshot-based only — live URL scanning isn't supported. Describes UX ethics, not legal determinations.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="repo-file-input-hidden" />
          <div className="pdf-drop-zone" onClick={() => fileInputRef.current?.click()}>
            <p className="repo-drop-text">{imageFile ? `✓ ${imageFile.name}` : "Click to upload a screenshot"}</p>
          </div>
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleAudit} disabled={!imageFile || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Auditing..." : "Audit for Dark Patterns"}
          </button>
          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Spot deceptive checkout and app design patterns</h2>
            <p>Hidden subscription checkboxes, fake urgency timers, and confusing button hierarchies are common enough to have a name: dark patterns. Upload a screenshot of a checkout flow or app screen, and this tool flags manipulative UX choices with a transparency score — a UX ethics review, not a legal determination.</p>
          </section>
        </>}
        canvas={output ? <div className="output-box" style={{ whiteSpace: "pre-wrap" }}>{output}</div> : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your audit will appear here.</p>}      />
    </>
  );
}