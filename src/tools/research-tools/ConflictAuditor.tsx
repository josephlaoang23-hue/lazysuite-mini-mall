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

const seo = TOOL_METADATA.conflictauditor;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

const SYSTEM_INSTRUCTIONS = `
SYSTEM INSTRUCTIONS: You are an elite Cross-Document Audit Analyst. Your task is to analyze the multi-source text provided by the user. Isolate the core factual assertions, statistics, and timeline claims across the texts. Cross-reference them simultaneously to find directly conflicting metrics, contradictory arguments, or blatant information gaps. Your output MUST be strictly formatted in Markdown and contain a structural matrix table with the columns: | Fact / Metric | Source A Claim | Source B Claim (or other sources) | The Discrepancy / Delta |.
`.trim();

const MAX_WORDS = 80000;

export default function ConflictAuditor({
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

  const handleAudit = async () => {
    if (!input.trim() || overLimit) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setOutput("");
    setExportFailed(false);

    triggerProcess("Cross-referencing your sources for conflicts and gaps...", async () => {
      setIsLoading(true);

      const promptInstructions = `${SYSTEM_INSTRUCTIONS}\n\nMulti-source text to audit:\n${input}`;

      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions,
            userInput: input,
            toolId: "conflictauditor",
            temperature: 0.1
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
          setErrorMsg(data.message || "Something went wrong auditing your sources. Please try again.");
          return;
        }

        setOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong auditing your sources. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleExport = () => {
    const success = downloadMarkdownTableAsCsv(output, "conflict-audit-matrix.csv");
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
            <h2 className="tool-header-title">Multi-Source Document Conflict & Gap Auditor</h2>
            <p className="tool-header-seo">
              Paste text from multiple sources — surface conflicting facts, statistics, and gaps in a structured matrix.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste text from multiple documents or articles here (up to 80,000 words)..."
              className="textarea-input"
              style={{ marginTop: "12px", height: "260px" }}
            />

            <p className={`research-word-count ${overLimit ? "over-limit" : ""}`}>
              {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
              {overLimit && " — please trim your input to continue"}
            </p>

            <button
              onClick={handleAudit}
              disabled={!input.trim() || overLimit || isLoading}
              className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
            >
              {remainingRuns === 0
                ? "Limit Exhausted – Click to Unlock"
                : isLoading
                  ? "⏳ Auditing Sources..."
                  : "Audit for Conflicts & Gaps"}
            </button>

            {errorMsg && (
              <div className="output-box" style={{ borderColor: "#ef4444", color: "#f87171" }}>
                {errorMsg}
              </div>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>Find where your sources disagree</h2>
              <p>When you're working across multiple articles, reports, or documents, contradictions and gaps are easy to miss. This tool cross-references your pasted sources and surfaces conflicting facts, statistics, and timeline claims in a clean, exportable matrix.</p>
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
              Your conflict & gap matrix will appear here.
            </p>
          )
        }
      />
    </>
  );
}