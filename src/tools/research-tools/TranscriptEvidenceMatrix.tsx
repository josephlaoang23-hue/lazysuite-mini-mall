import { useState } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import { downloadMarkdownTableAsCsv } from "../../utils/markdownTableToCsv";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/ResearchTools.css";

const seo = TOOL_METADATA.transcriptevidence;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

const SYSTEM_INSTRUCTIONS = `
SYSTEM INSTRUCTIONS: You are an expert Qualitative Data Researcher. Your task is to process the massive, raw conversational transcript provided by the user. Filter out all conversational filler words and linguistic noise. Group the conversation into major themes, extract high-impact verbatim quotes, and pair them with the exact speaker and timestamp. Your output MUST be strictly formatted in standard Markdown with a table using the columns: | Core Theme | Verbatim Quote | Speaker & Timestamp | Actionable Research Takeaway |.
`.trim();

const MAX_WORDS = 80000;

export default function TranscriptEvidenceMatrix({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > MAX_WORDS;

  const handleProcess = async () => {
    if (!input.trim() || overLimit) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setOutput("");
    setExportFailed(false);

    triggerProcess("Structuring your transcript into themed evidence...", async () => {
      setIsLoading(true);

      const promptInstructions = `${SYSTEM_INSTRUCTIONS}\n\nRaw transcript to process:\n${input}`;

      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions,
            userInput: input,
            toolId: "transcriptevidence",
            temperature: 0.2
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));

        if (response.status === 202) {
          onRequestUnlimited(promptInstructions, input, setOutput);
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong processing your transcript. Please try again.");
          return;
        }

        setOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong processing your transcript. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleExport = () => {
    const success = downloadMarkdownTableAsCsv(output, "transcript-evidence-matrix.csv");
    if (!success) setExportFailed(true);
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
            <h2 className="tool-header-title">Chaotic Transcript-to-Structured Evidence Matrix</h2>
            <p className="tool-header-seo">
              Paste a messy interview or podcast transcript — get themed quotes with speakers, timestamps, and takeaways.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your raw interview or podcast transcript here (up to 80,000 words)..."
              className="textarea-input"
              style={{ marginTop: "12px", height: "260px" }}
            />

            <p className={`research-word-count ${overLimit ? "over-limit" : ""}`}>
              {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
              {overLimit && " — please trim your input to continue"}
            </p>

            <button
              onClick={handleProcess}
              disabled={!input.trim() || overLimit || isLoading}
              className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
            >
              {remainingRuns === 0
                ? "Limit Exhausted – Click to Unlock"
                : isLoading
                  ? "⏳ Structuring Evidence..."
                  : "Build Evidence Matrix"}
            </button>

            {errorMsg && (
              <div className="output-box" style={{ borderColor: "#ef4444", color: "#f87171" }}>
                {errorMsg}
              </div>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>Turn a raw transcript into usable research evidence</h2>
              <p>Two-hour interviews and podcast transcripts bury useful insights in filler and cross-talk. This tool groups the conversation into major themes and pairs each with a verbatim quote, speaker, and timestamp — ready to export and cite.</p>
            </section>
          </>
        }
        canvas={
          output ? (
            <div className="research-output">
              <div className="research-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
              </div>

              <button className="btn-generate" onClick={handleExport} style={{ marginTop: "16px" }}>
                📥 Export to CSV File
              </button>

              {exportFailed && (
                <p className="research-export-error">
                  Couldn't detect a table in the output to export. You can still copy the text above manually.
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
              Your themed evidence matrix will appear here.
            </p>
          )
        }
      />
    </>
  );
}