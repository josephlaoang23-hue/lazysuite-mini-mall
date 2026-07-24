import { useState, useRef } from "react";
import mermaid from "mermaid";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/LogicMapStudio.css";
interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

// Mermaid needs to be told once, up front, how to look and that we'll
// trigger renders ourselves (not automatically on page load).
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: "#0f172a",
    primaryColor: "#1e293b",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#2dd4bf",
    lineColor: "#2dd4bf",
    secondaryColor: "#020617",
    tertiaryColor: "#020617"
  }
});

export default function LogicMapStudio({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [codeInput, setCodeInput] = useState<string>("");
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [svgOutput, setSvgOutput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showRawCode, setShowRawCode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Each render needs a fresh, unique ID or Mermaid gets confused
  // if you generate more than one diagram per page visit.
  const renderCounter = useRef(0);

  const handleMapLogic = async () => {
    if (!codeInput.trim()) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setSvgOutput("");

    triggerProcess("Mapping your code's logic into a visual flowchart...", async () => {
      setIsLoading(true);

      const promptText = `
You are an expert software architect who converts code logic into flowcharts.

Read the user's code and output ONLY valid Mermaid.js flowchart syntax describing its execution logic.

Rules:
- Start with: flowchart TD
- Represent every if/else branch, loop, success path, and error/failure path as separate nodes.
- Use clear, short labels in plain English (not code snippets) inside each node — describe WHAT happens, not the raw syntax.
- Use diamond shapes for decision points (if/else conditions).
- Use rectangle shapes for actions/steps.
- Do NOT include markdown code fences (no triple backticks).
- Do NOT include any explanation, preamble, or text outside the Mermaid syntax.
- Output ONLY the raw Mermaid flowchart code, nothing else.
`;

  // Gemini sometimes wraps output in ```mermaid fences even when told not to —
      // this strips them out just in case, so rendering doesn't break.
      const handleAiOutput = async (rawOutput: string) => {
        const cleaned = rawOutput
          .replace(/```mermaid/gi, "")
          .replace(/```/g, "")
          .trim();

        setMermaidCode(cleaned);
        await renderDiagram(cleaned);
      };

      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: promptText, userInput: codeInput, toolId: "logicmap" })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) {
          onUpdateRemaining(Number(limitRemaining));
        }

        if (response.status === 202) {
          onRequestUnlimited(promptText, codeInput, handleAiOutput);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong generating the map. Please try again.");
          return;
        }

        await handleAiOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong generating the map. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  const renderDiagram = async (code: string) => {
    try {
      renderCounter.current += 1;
      const uniqueId = `logic-map-${renderCounter.current}`;
      const { svg } = await mermaid.render(uniqueId, code);
      setSvgOutput(svg);
      setErrorMsg("");
    } catch (err) {
      console.error("Mermaid render failed:", err);
      setErrorMsg(
        "The AI's diagram had a formatting issue and couldn't be drawn. You can view the raw output below and try again."
      );
      setSvgOutput("");
      setShowRawCode(true);
    }
  };

  const copyMermaidCode = async () => {
    await navigator.clipboard.writeText(mermaidCode);
  };

  return (
    <ToolLayout
      controls={
        <>
          <h2 className="tool-header-title">Code-to-State Logic Map Studio</h2>
          <p className="tool-header-seo">
            Paste any code logic — auth gates, checkout flows, game rules — and see it as a visual flowchart.
          </p>

          <RunsBadge remainingRuns={remainingRuns} />

          <textarea
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Paste your code here (e.g. a login function, a checkout sequence, a game rule set)..."
            className="textarea-input"
            style={{ marginTop: "12px", height: "180px" }}
          />

          <button
            onClick={handleMapLogic}
            disabled={!codeInput.trim() || isLoading}
            className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
          >
            {remainingRuns === 0
              ? "Limit Exhausted – Click to Unlock"
              : isLoading
                ? "⏳ Mapping Logic..."
                : "Map Logic"}
          </button>

          {errorMsg && (
            <div
              className="output-box"
              style={{ borderColor: "#ef4444", color: "#f87171" }}
            >
              {errorMsg}
            </div>
          )}

          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Turn code logic into a visual flowchart</h2>
            <p>Reading raw code to understand its branching logic — every if/else, loop, and error path — is slow, especially in unfamiliar codebases. This tool reads your pasted function or logic block and generates a clean visual flowchart, making it easy to see the actual decision paths at a glance instead of tracing through lines of code.</p>

            <h2>Visualize auth gates, checkout flows, and business logic</h2>
            <p>Whether you're documenting a login flow, a checkout sequence, or a game's rule engine, this tool converts your code into a labeled flowchart with decision diamonds and action steps — useful for onboarding teammates, writing documentation, or just understanding logic you wrote months ago.</p>
          </section>
        </>
      }
      canvas={
        svgOutput ? (
          <div className="logic-map-output">
            <div className="output-header">
              <span>Logic Flowchart</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="copy-button" onClick={copyMermaidCode} title="Copy Mermaid code">
                  Copy Code
                </button>
                <button
                  className="copy-button"
                  onClick={() => setShowRawCode(!showRawCode)}
                  title="Toggle raw Mermaid syntax"
                >
                  {showRawCode ? "Hide Raw" : "View Raw"}
                </button>
              </div>
            </div>

            <div
              className="logic-map-diagram"
              dangerouslySetInnerHTML={{ __html: svgOutput }}
            />

            {showRawCode && (
              <pre className="logic-map-raw">{mermaidCode}</pre>
            )}
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
            Your flowchart will appear here once generated.
          </p>
        )
      }
    />
  );
}