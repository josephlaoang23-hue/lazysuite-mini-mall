import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/PromptCompressor.css";

const seo = TOOL_METADATA.promptcompressor;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

const SYSTEM_INSTRUCTIONS = `
SYSTEM INSTRUCTIONS: You are an elite AI Prompt Optimization Engineer specializing in high-efficiency context structuring. Your sole job is to take the user's conversational, repetitive, or wordy system prompt and compress it into a dense, structural markdown layout.

- Eliminate all conversational filler, politeness, and redundant phrases.
- Use ultra-dense syntax like structured Markdown bullet points, XML tags (e.g., <rules>, <constraints>), or shorthand logic notation.
- Retain 100% of the original prompt's logical edge cases, core parameters, variables, and behavior restrictions.
- Your output MUST be strictly formatted in valid Markdown with exactly two sections:

### 💎 Optimized Token Prompt
[Provide the newly compressed prompt block wrapped inside a clean standard code block matching the language requested or text format]

### 📊 Optimization Analytics
- **Estimated Token Reduction:** [Provide an estimated percentage, e.g., 45% Tokens Saved]
- **Key Consolidations Made:** [Provide a 2-3 bullet point summary of what wordy sections you consolidated into dense syntax]
`.trim();

export default function PromptCompressor({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [input, setInput] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [analyticsText, setAnalyticsText] = useState("");
  const [savingsPercent, setSavingsPercent] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const parseOutput = (rawOutput: string) => {
    const promptSectionMatch = rawOutput.match(/### 💎[^\n]*\n([\s\S]*?)(?=###|$)/);
    const codeBlockMatch = promptSectionMatch?.[1]?.match(/```[a-zA-Z]*\n?([\s\S]*?)```/);
    const extractedPrompt = codeBlockMatch
      ? codeBlockMatch[1].trim()
      : (promptSectionMatch?.[1]?.trim() || rawOutput.trim());

    const analyticsMatch = rawOutput.match(/### 📊[^\n]*\n([\s\S]*)/);
    const extractedAnalytics = analyticsMatch?.[1]?.trim() || "";

    const percentMatch = extractedAnalytics.match(/(\d{1,3})\s*%/);
    const percent = percentMatch ? Math.min(100, parseInt(percentMatch[1], 10)) : null;

    setOptimizedPrompt(extractedPrompt);
    setAnalyticsText(extractedAnalytics);
    setSavingsPercent(percent);
  };

  const handleCompress = async () => {
    if (!input.trim()) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setOptimizedPrompt("");
    setAnalyticsText("");
    setSavingsPercent(null);

    triggerProcess("Compressing your prompt into dense, token-efficient syntax...", async () => {
      setIsLoading(true);

      const promptInstructions = `${SYSTEM_INSTRUCTIONS}\n\nUser's wordy system prompt to compress:\n${input}`;

      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions,
            userInput: input,
            toolId: "promptcompressor",
            temperature: 0.1
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));

        if (response.status === 202) {
          onRequestUnlimited(promptInstructions, input, parseOutput);
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong compressing your prompt. Please try again.");
          return;
        }

        parseOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong compressing your prompt. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Illustrative estimate only, per the spec's own "assume a rough baseline" framing —
  // real savings depend entirely on which model/provider you're actually billed by.
  const estimatedSavingsUsd = savingsPercent !== null
    ? ((savingsPercent / 10) * 1.5).toFixed(2)
    : null;

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
            <h2 className="tool-header-title">Context-Insulated System Prompt Compressor</h2>
            <p className="tool-header-seo">
              Paste a wordy, conversational system prompt — get a dense, token-optimized version back.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your wordy, conversational system prompt or instructions here..."
              className="textarea-input"
              style={{ marginTop: "12px", height: "220px" }}
            />

            <button
              onClick={handleCompress}
              disabled={!input.trim() || isLoading}
              className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
            >
              {remainingRuns === 0
                ? "Limit Exhausted – Click to Unlock"
                : isLoading
                  ? "⏳ Compressing..."
                  : "Compress & Optimize Prompt"}
            </button>

            {errorMsg && (
              <div className="output-box" style={{ borderColor: "#ef4444", color: "#f87171" }}>
                {errorMsg}
              </div>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>Cut your system prompt's token footprint</h2>
              <p>Long, conversational system prompts quietly inflate every API call you make. This tool restructures your prompt into dense, efficient syntax — stripping filler while preserving every rule, edge case, and constraint — so you send fewer tokens on every request.</p>
            </section>
          </>
        }
        canvas={
          optimizedPrompt ? (
            <div className="prompt-compressor-output">
              {savingsPercent !== null && (
                <div className="token-savings-tracker">
                  <div className="token-savings-bar-track">
                    <div
                      className="token-savings-bar-fill"
                      style={{ width: `${savingsPercent}%` }}
                    />
                  </div>
                  <div className="token-savings-label">
                    <span>{savingsPercent}% Tokens Saved</span>
                  </div>
                </div>
              )}

              <div className="output-box" style={{ position: "relative" }}>
                <button
                  className="copy-button"
                  onClick={copyPrompt}
                  style={{ position: "absolute", top: "12px", right: "12px" }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <pre className="prompt-compressor-code">{optimizedPrompt}</pre>
              </div>

              {analyticsText && (
                <div className="prompt-compressor-analytics">
                  {analyticsText}
                </div>
              )}

              {estimatedSavingsUsd && (
                <div className="prompt-compressor-savings-widget">
                  💰 Optimizing this prompt could save you roughly <strong>${estimatedSavingsUsd}</strong> per 1 million API calls on commercial frontier models.
                  <span className="prompt-compressor-savings-disclaimer">
                    Rough illustrative estimate only — actual savings depend on your specific model provider and pricing.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
              Your optimized prompt and savings estimate will appear here.
            </p>
          )
        }
      />
    </>
  );
}