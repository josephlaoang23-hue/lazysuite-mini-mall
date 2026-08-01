import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.thumbnailauditor;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a thumbnail design reviewer. Analyze this thumbnail image for text size, contrast, visual hierarchy, safe zones, clutter, and mobile visibility.
Return Markdown: ### Readability Score (X/10, your best visual estimate, not a measured metric) ### Mobile Visibility Score (X/10, same caveat) ### Contrast Analysis ### Text Size Feedback ### Safe-Zone Warnings ### Actionable Improvements (3-5 bullets)
Note: scores are visual estimates, not precise measurements.`;

export default function ThumbnailAuditor({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
  });

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setOutput(""); setErrorMsg("");
  };

  const handleAudit = async () => {
    if (!imageFile) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");
    triggerProcess("Analyzing your thumbnail for readability and CTR...", async () => {
      setIsLoading(true);
      try {
        const imageBase64 = await fileToBase64(imageFile);
        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, imageBase64, mimeType: imageFile.type, toolId: "thumbnailauditor" })
        });
        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));
        if (response.status === 202) { onRequestUnlimited(PROMPT, "[thumbnail uploaded]", setOutput); return; }
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
          <h2 className="tool-header-title">Thumbnail Readability & CTR Auditor</h2>
          <p className="tool-header-seo">Upload a thumbnail — get an advisory readability and mobile-visibility review.</p>
          <p className="a11y-disclaimer">Scores are visual estimates, not measured metrics — use as a directional guide, not a guarantee.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} className="repo-file-input-hidden" />
          <div className="pdf-drop-zone" onClick={() => fileInputRef.current?.click()}>
            <p className="repo-drop-text">{imageFile ? `✓ ${imageFile.name}` : "Click to upload your thumbnail"}</p>
          </div>
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleAudit} disabled={!imageFile || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Auditing..." : "Audit Thumbnail"}
          </button>
          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>A weak thumbnail can sink a great video before anyone clicks</h2>
            <p>Most viewers decide whether to click based on the thumbnail alone, often on a small mobile screen. This tool reviews your thumbnail for text size, contrast, visual hierarchy, clutter, and safe-zone placement — the same things a human editor would check before you publish.</p>

            <h2>Advisory feedback, not a guaranteed CTR prediction</h2>
            <p>Readability and mobile-visibility scores here are visual estimates meant to catch obvious problems — cramped text, low contrast, cluttered composition — not a promise of how many clicks you'll get. Use it as a second pair of eyes before you hit publish.</p>
          </section>
        </>}
        canvas={
          <>
            {imagePreviewUrl && (
              <div style={{ marginBottom: "16px", borderRadius: "8px", overflow: "hidden", border: "1px solid #1e293b" }}>
                <img src={imagePreviewUrl} alt="Thumbnail preview" style={{ width: "100%", display: "block" }} />
              </div>
            )}
            {output ? (
              <div className="output-box" style={{ whiteSpace: "pre-wrap" }}>{output}</div>
            ) : (
              <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your thumbnail audit will appear here.</p>
            )}
          </>
        }
      />
    </>
  );
}