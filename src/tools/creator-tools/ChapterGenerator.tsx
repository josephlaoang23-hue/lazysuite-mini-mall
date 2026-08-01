import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.chaptergenerator;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a YouTube chapter editor. Analyze the transcript for topic transitions and generate clean, properly formatted YouTube chapters.
Return ONLY the chapter list in this exact format, one per line: MM:SS Short Descriptive Title
Start at 00:00. If the transcript includes real timestamps, use them; otherwise estimate reasonable proportional timestamps based on text position and note in one sentence above the list that these are estimated.`;

export default function ChapterGenerator({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");
    triggerProcess("Detecting topic transitions and building chapters...", async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, userInput: input, toolId: "chaptergenerator" })
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
          <h2 className="tool-header-title">YouTube Timestamp & Chapter Generator</h2>
          <p className="tool-header-seo">Paste a transcript — get ready-to-paste YouTube chapters.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your video, podcast, or lecture transcript here..." className="textarea-input" style={{ marginTop: "12px", height: "220px" }} />
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleGenerate} disabled={!input.trim() || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Generating Chapters..." : "Generate Chapters"}
          </button>
          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Skip manually timestamping your own video</h2>
            <p>Adding chapter markers to a YouTube video means rewatching it and guessing where each topic starts. This tool reads your transcript, detects real topic transitions, and outputs clean MM:SS timestamps with descriptive titles, formatted exactly the way YouTube expects them pasted into the description box.</p>

            <h2>Better chapters mean better watch time and discoverability</h2>
            <p>Chapters help viewers jump to what they care about and give YouTube's search more context about your video's structure. If your transcript already has real timestamps, they're used directly; otherwise the tool estimates proportional placement and tells you so.</p>
          </section>
        </>}
        canvas={output ? (
          <div className="output-box" style={{ position: "relative", whiteSpace: "pre-wrap" }}>
            <button className="copy-button" onClick={copyOutput} style={{ position: "absolute", top: "12px", right: "12px" }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            {output}
          </div>
        ) : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your YouTube chapters will appear here.</p>}      />
    </>
  );
}