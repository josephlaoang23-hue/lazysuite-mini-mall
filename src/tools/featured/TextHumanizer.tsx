import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";

import RunsBadge from "../../components/RunsBadge";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void; // ← this line
}

export default function TextHumanizer({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setIsLoading(true);

    triggerProcess("Streaming organic language syntax models across serverless rails...", async () => {
      const promptText = `
      You are an expert writing editor.

      Your task is to rewrite the user's text so it sounds like it was written naturally by a fluent human.
      
      Requirements:
      
      - Return ONLY the rewritten text.
      - Preserve the original meaning.
      - Do not add or remove important information.
      - Do not explain your changes.
      - Do not use headings.
      - Do not use bullet points.
      - Do not provide multiple versions.
      - Maintain approximately the same length.
      - Improve flow, rhythm, readability, and sentence variety.
      - Remove robotic wording, repetition, and AI-style phrasing.
      - Make the writing feel authentic, conversational, and natural while remaining grammatically correct.
      - Keep the same language as the user's input.
      
      Output only the rewritten text.
`;

try {
  const response = await fetch('/api/run-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptInstructions: promptText, userInput: input })
  });

  const limitRemaining = response.headers.get('X-RateLimit-Remaining');
  if (limitRemaining !== null) {
    onUpdateRemaining(Number(limitRemaining));
  }

  if (response.status === 202) {
    setIsLoading(false);
    onRequestUnlimited(promptText, input, (output) => setOutput(output));
    return;
  }

  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Server returned invalid JSON:\n${responseText}`);
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  setOutput(data.output);
  setIsLoading(false);
} catch (error) {
  console.error("Request failed:", error);
  setIsLoading(false);
  if (error instanceof Error) {
    setOutput(error.message);
  } else {
    setOutput("Unknown error");
  }
}
    });
  };

  return (
    <>
      <Helmet>
        <title>{TOOL_METADATA.humanizer.title}</title>

        <meta
          name="description"
          content={TOOL_METADATA.humanizer.description}
        />

        <link
          rel="canonical"
          href={`https://lazysuite-mini-mall.vercel.app${TOOL_METADATA.humanizer.canonical}`}
        />

        <meta
          property="og:title"
          content={TOOL_METADATA.humanizer.title}
        />

        <meta
          property="og:description"
          content={TOOL_METADATA.humanizer.description}
        />
      </Helmet>

      <div>
        <h2 className="tool-header-title">AI Text Humanizer</h2>
        <RunsBadge remainingRuns={remainingRuns} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste sentence loops here to watch the edge processor humanize them in real-time..."
          className="textarea-input"
          style={{ marginTop: '12px' }}
        />
        <button
          onClick={handleGenerate}
          disabled={remainingRuns > 0 && !input}
          className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
        >
          {remainingRuns === 0
            ? "Limit Exhausted – Click to Unlock"
            : isLoading
              ? "⏳ Humanizing..."
              : "Humanize"}
        </button>
        {output && (
          <div className="output-box">

            <div className="output-header">
              <span>Humanized Text</span>

              <button
                className="copy-button"
                onClick={copyOutput}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>

            </div>

            <div className="output-content">
              {output}
            </div>

          </div>
        )}
      </div>
    </>
  );
}