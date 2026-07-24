import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.legacycodemodernizer;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

mermaid.initialize({ startOnLoad: false, theme: "dark", themeVariables: { background: "#0f172a", primaryColor: "#1e293b", primaryTextColor: "#f8fafc", primaryBorderColor: "#2dd4bf", lineColor: "#2dd4bf", secondaryColor: "#020617", tertiaryColor: "#020617" } });

const PROMPT = `You are a senior software engineer specializing in legacy code (old PHP, jQuery, COBOL, Visual Basic, classic ASP, etc). Explain how the provided code works, identify dependencies/outdated practices, summarize execution flow, then provide a modern equivalent (TypeScript, Python, or modern JavaScript as appropriate). If a flowchart would help, include ONE \`\`\`mermaid flowchart TD block. Format as Markdown with headers: ### How It Works, ### Outdated Practices & Dependencies, ### Modern Equivalent (code block).`;

export default function LegacyCodeModernizer({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [input, setInput] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [svgOutput, setSvgOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const counter = useRef(0);

  const parseOutput = async (raw: string) => {
    const mermaidMatch = raw.match(/```mermaid([\s\S]*?)```/);
    setMarkdown(raw.replace(/```mermaid[\s\S]*?```/, "").trim());
    if (mermaidMatch?.[1]) {
      try { counter.current += 1; const { svg } = await mermaid.render(`legacy-${counter.current}`, mermaidMatch[1].trim()); setSvgOutput(svg); }
      catch (e) { console.error(e); setSvgOutput(""); }
    } else setSvgOutput("");
  };

  const handleModernize = async () => {
    if (!input.trim()) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setMarkdown(""); setSvgOutput("");
    triggerProcess("Explaining and modernizing your code...", async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, userInput: input, toolId: "legacycodemodernizer" })
        });
        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));
        if (response.status === 202) { onRequestUnlimited(PROMPT, input, parseOutput); return; }
        const data = await response.json();
        if (!response.ok) { setErrorMsg(data.message || "Something went wrong."); return; }
        await parseOutput(data.output);
      } catch (e) { console.error(e); setErrorMsg("Something went wrong."); }
      finally { setIsLoading(false); }
    });
  };

  return (
    <>
      <Helmet><title>{seo.title}</title><meta name="description" content={seo.description} /><link rel="canonical" href={seo.canonical} /></Helmet>
      <ToolLayout
        controls={<>
          <h2 className="tool-header-title">Legacy Code Explainer & Modernizer</h2>
          <p className="tool-header-seo">Paste old PHP, jQuery, VB, or COBOL code — get an explanation and a modern equivalent.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your legacy code here..." className="textarea-input" style={{ marginTop: "12px", height: "220px" }} />
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleModernize} disabled={!input.trim() || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Modernizing..." : "Explain & Modernize"}
          </button>
          <AdsterraNativeBanner />
        </>}
        canvas={markdown ? (
          <div>
            {svgOutput && <div className="logic-map-diagram" dangerouslySetInnerHTML={{ __html: svgOutput }} />}
            <div className="research-markdown"><ReactMarkdown>{markdown}</ReactMarkdown></div>
          </div>
        ) : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your explanation and modern code will appear here.</p>}
      />
    </>
  );
}