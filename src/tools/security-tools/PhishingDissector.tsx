import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.phishingdissector;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a phishing/scam email analyst. Analyze the provided email content (text or described screenshot) for indicators: spoofed sender address, mismatched/suspicious URLs, urgent/threatening language, suspicious attachments, fake login requests, grammar inconsistencies, impersonation attempts.
Return Markdown with:
### Red Flags Found
- bullet each flag with a short explanation
### Overall Risk Rating
State Low, Medium, or High with 1-sentence reasoning.
### Recommendations
2-3 bullet safety recommendations (e.g. "Verify through the official website directly, not links in this email").
Note: you can only assess patterns in the text/image provided — you cannot verify a URL's true destination.`;

export default function PhishingDissector({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const canSubmit = activeTab === "text" ? input.trim().length > 0 : !!imageFile;

  const handleAnalyze = async () => {
    if (!canSubmit) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");

    triggerProcess("Scanning for phishing red flags...", async () => {
      setIsLoading(true);
      try {
        let response: Response;
        if (activeTab === "image" && imageFile) {
          const imageBase64 = await fileToBase64(imageFile);
          response = await fetch("/api/run-tool-image", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
            body: JSON.stringify({ promptInstructions: PROMPT, imageBase64, mimeType: imageFile.type, toolId: "phishingdissector" })
          });
        } else {
          response = await fetch("/api/run-tool", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
            body: JSON.stringify({ promptInstructions: PROMPT, userInput: input, toolId: "phishingdissector" })
          });
        }
        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));
        if (response.status === 202) { onRequestUnlimited(PROMPT, activeTab === "text" ? input : "[image uploaded]", setOutput); return; }
        const data = await response.json();
        if (!response.ok) { setErrorMsg(data.message || "Something went wrong. Please try again."); return; }
        setOutput(data.output);
      } catch (e) { console.error(e); setErrorMsg("Something went wrong. Please try again."); }
      finally { setIsLoading(false); }
    });
  };

  return (
    <>
      <Helmet><title>{seo.title}</title><meta name="description" content={seo.description} /><link rel="canonical" href={seo.canonical} /></Helmet>
      <ToolLayout
        controls={<>
          <h2 className="tool-header-title">Phishing / Scam Email Dissector</h2>
          <p className="tool-header-seo">Paste an email or upload a screenshot to spot phishing red flags.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <div className="tab-toggle-bar" style={{ marginTop: "12px" }}>
            <button className={activeTab === "text" ? "tab-button tab-button-active" : "tab-button"} onClick={() => setActiveTab("text")}>Paste Email Text</button>
            <button className={activeTab === "image" ? "tab-button tab-button-active" : "tab-button"} onClick={() => setActiveTab("image")}>Upload Screenshot</button>
          </div>
          {activeTab === "text" ? (
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste the suspicious email content here..." className="textarea-input" style={{ marginTop: "12px" }} />
          ) : (
            <div className="audio-upload-zone">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="audio-file-input" />
              {imageFile && <p className="audio-file-name">✓ {imageFile.name}</p>}
            </div>
          )}
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleAnalyze} disabled={!canSubmit || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Analyzing..." : "Analyze for Phishing Signs"}
          </button>
          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Spot phishing red flags before you click</h2>
            <p>Suspicious emails often share common tells — spoofed senders, urgent language, mismatched links, fake login prompts. This tool scans the text or a screenshot you provide and flags these patterns, giving you a risk rating and next steps. It analyzes what's visible in the content you share — it can't verify where a link actually leads.</p>
          </section>
        </>}
        canvas={output ? <div className="output-box" style={{ whiteSpace: "pre-wrap" }}>{output}</div> : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your analysis will appear here.</p>}      />
    </>
  );
}