import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.contentrepurposer;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a content repurposing strategist. Take the provided long-form content (YouTube script, blog post, podcast transcript, newsletter, or article) and reformat it into platform-specific versions, restructuring — not just summarizing — to match each platform's style and constraints.
Return Markdown with these headers, each containing a ready-to-post version: ### X/Twitter Thread ### LinkedIn Carousel Text ### Facebook Post ### Instagram Caption ### Newsletter Summary ### Blog Outline (optional)
Preserve the original core message across all versions.`;

export default function ContentRepurposer({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");
    triggerProcess("Repurposing your content for every platform...", async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, userInput: input, toolId: "contentrepurposer" })
        });
        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));
        if (response.status === 202) { onRequestUnlimited(PROMPT, input, setOutput); return; }
        const data = await response.json();
        if (!response.ok) { setErrorMsg(data.message || "Something went wrong."); return; }
        setOutput(data.output);
      } catch (e) { console.error(e); setErrorMsg("Something went wrong."); }
      finally { setIsLoading(false); }
    });
  };

  const copyOutput = async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <>
      <Helmet><title>{seo.title}</title><meta name="description" content={seo.description} /><link rel="canonical" href={seo.canonical} /></Helmet>
      <ToolLayout
        controls={<>
          <h2 className="tool-header-title">Content Repurposing Format Transformer</h2>
          <p className="tool-header-seo">Paste one piece of content — get platform-ready versions for every channel.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your YouTube script, blog post, podcast transcript, or newsletter here..." className="textarea-input" style={{ marginTop: "12px", height: "220px" }} />
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleGenerate} disabled={!input.trim() || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Repurposing..." : "Repurpose Content"}
          </button>
          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Turn one piece of content into a week's worth of posts</h2>
            <p>Writing separate posts for X, LinkedIn, Instagram, and your newsletter takes forever. This tool reads your original script, blog post, or transcript and restructures it — not just copy-pastes it — into a version tailored to each platform's format, tone, and length constraints.</p>

            <h2>Stop starting from a blank page for every channel</h2>
            <p>Whether you're a solo creator or managing content for a small team, repurposing is one of the highest-leverage habits in content marketing. Paste your source content once and get ready-to-post drafts for six formats in a single pass.</p>
          </section>
        </>}
        canvas={output ? (
          <div className="output-box" style={{ position: "relative", whiteSpace: "pre-wrap" }}>
            <button className="copy-button" onClick={copyOutput} style={{ position: "absolute", top: "12px", right: "12px" }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            {output}
          </div>
        ) : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your platform-ready versions will appear here.</p>}      />
    </>
  );
}