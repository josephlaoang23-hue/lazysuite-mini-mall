import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.abstractsynthesizer;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a science communicator. Rewrite the academic abstract/excerpt in plain everyday language. Return Markdown: ### Plain-Language Summary ### Main Findings ### Limitations ### Methodology & Sample Size (if mentioned) ### Funding/Conflicts of Interest (if mentioned) ### What This Means in Practice. If a section isn't mentioned in the source, say so rather than inventing it.`;

export default function AbstractSynthesizer({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");
    triggerProcess("Translating the research into plain language...", async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, userInput: input, toolId: "abstractsynthesizer" })
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

  return (
    <>
      <Helmet><title>{seo.title}</title><meta name="description" content={seo.description} /><link rel="canonical" href={seo.canonical} /></Helmet>
      <ToolLayout
        controls={<>
          <h2 className="tool-header-title">Academic Abstract Synthesizer</h2>
          <p className="tool-header-seo">Paste a dense abstract — get plain language, findings, limitations, and takeaways.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste an academic abstract, research summary, or paper introduction..." className="textarea-input" style={{ marginTop: "12px", height: "200px" }} />
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleGenerate} disabled={!input.trim() || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Synthesizing..." : "Synthesize Abstract"}
          </button>
          <AdsterraNativeBanner />
        </>}
        canvas={output ? <div className="output-box" style={{ whiteSpace: "pre-wrap" }}>{output}</div> : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your plain-language summary will appear here.</p>}
      />
    </>
  );
}