import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import DiagramFullscreen from "../../components/DiagramFullscreen";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/MultiAgentBlueprintGenerator.css";

const seo = TOOL_METADATA.multiagentblueprint;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

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

const SYSTEM_INSTRUCTIONS = `
SYSTEM INSTRUCTIONS: You are a Principal AI Systems Architect specializing in Multi-Agent workflows (CrewAI, LangGraph, AutoGen). Your sole task is to analyze the user's large, monolithic project idea or prompt and structurally decouple it into a highly efficient, cooperative multi-agent system.

Your output MUST be strictly formatted in Markdown and contain exactly three sections:

### 🗺️ System Interaction Map
Provide a valid, clean Mermaid.js flowchart (wrapped in standard \`\`\`mermaid blocks) mapping out data inputs, agent handoffs, loops, validation gates, and the final output path.

### 🤖 Agent Squad Roster
For every single agent required in the pipeline, output their specific profile:
- **Agent Name & Specialized Role**
- **Operational Objective / Goal**
- **Exact System Prompt:** (Write a highly descriptive, context-insulated prompt for this sub-agent).
- **Input Dependencies & Output Artifacts:** (What data they take in, what file format/JSON structure they pass to the next agent).

### ⚙️ Execution Loop & Safety Guardrails
Provide a short bulleted list detailing how the orchestrator handles edge-case failures, loops, and token-saving caching tricks specific to Gemini 3.5 Flash.
`.trim();

export default function MultiAgentBlueprintGenerator({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [input, setInput] = useState("");
  const [rawOutput, setRawOutput] = useState("");
  const [diagramSvg, setDiagramSvg] = useState("");
  const [remainingMarkdown, setRemainingMarkdown] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const renderCounter = useRef(0);

  const parseAndRenderOutput = async (output: string) => {
    setRawOutput(output);

    const mermaidMatch = output.match(/```mermaid([\s\S]*?)```/);
    const restOfMarkdown = output.replace(/```mermaid[\s\S]*?```/, "").trim();
    setRemainingMarkdown(restOfMarkdown);

    if (mermaidMatch && mermaidMatch[1]) {
      try {
        renderCounter.current += 1;
        const uniqueId = `agent-blueprint-${renderCounter.current}`;
        const { svg } = await mermaid.render(uniqueId, mermaidMatch[1].trim());
        setDiagramSvg(svg);
      } catch (err) {
        console.error("Mermaid render failed:", err);
        setDiagramSvg("");
      }
    } else {
      setDiagramSvg("");
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setRawOutput("");
    setDiagramSvg("");
    setRemainingMarkdown("");

    triggerProcess("Decoupling your project into a multi-agent architecture...", async () => {
      setIsLoading(true);

      const promptInstructions = `${SYSTEM_INSTRUCTIONS}\n\nUser's project brain dump / prompt to decompose:\n${input}`;

      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions,
            userInput: input,
            toolId: "multiagentblueprint",
            temperature: 0.2
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));

        if (response.status === 202) {
          onRequestUnlimited(promptInstructions, input, parseAndRenderOutput);
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong generating the blueprint. Please try again.");
          return;
        }

        await parseAndRenderOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong generating the blueprint. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
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
            <h2 className="tool-header-title">AI Context-Shift Multi-Agent Blueprint Generator</h2>
            <p className="tool-header-seo">
              Paste a massive project idea or monolithic prompt — get an organized multi-agent architecture, ready-to-use system prompts, and a visual flowchart.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your massive project idea, codebase overview, or complex prompt workflow here..."
              className="textarea-input"
              style={{ marginTop: "12px", height: "220px" }}
            />

            <button
              onClick={handleGenerate}
              disabled={!input.trim() || isLoading}
              className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
            >
              {remainingRuns === 0
                ? "Limit Exhausted – Click to Unlock"
                : isLoading
                  ? "⏳ Generating Blueprint..."
                  : "Generate Multi-Agent Blueprint"}
            </button>

            {errorMsg && (
              <div className="output-box" style={{ borderColor: "#ef4444", color: "#f87171" }}>
                {errorMsg}
              </div>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>Turn a messy prompt into a real multi-agent system</h2>
              <p>Monolithic prompts get unwieldy fast. This tool reads your raw project idea and breaks it into a clean multi-agent architecture — complete with a visual flowchart, individual agent system prompts, and handoff structure — ready to drop into CrewAI, LangGraph, or AutoGen.</p>
            </section>
          </>
        }
        canvas={
          rawOutput ? (
            <div className="agent-blueprint-output">
              {diagramSvg && (
                <div className="agent-blueprint-diagram-block">
                  <div className="output-header">
                    <span>System Interaction Map</span>
                    <button className="copy-button" onClick={() => setShowFullscreen(true)} title="Maximize diagram">
                      ⛶ Maximize
                    </button>
                  </div>
                  <div className="logic-map-diagram" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                </div>
              )}

              {showFullscreen && (
                <DiagramFullscreen
                  svg={diagramSvg}
                  title="System Interaction Map"
                  onClose={() => setShowFullscreen(false)}
                />
              )}

              <div className="agent-blueprint-markdown">
                <ReactMarkdown>{remainingMarkdown}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
              Your multi-agent blueprint will appear here once generated.
            </p>
          )
        }
      />
    </>
  );
}