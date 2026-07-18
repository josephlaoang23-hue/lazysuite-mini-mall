import { useState } from 'react';
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import { Copy, Check } from "lucide-react";

import RunsBadge from "../../components/RunsBadge";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void; // ← this line
}

export default function ChatGptCleaner({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
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

    triggerProcess(
      "Removing ChatGPT formatting artifacts and cleaning your text...",
      async () => {
        const promptText = `
You are an expert ChatGPT formatting cleaner.

Your task is to clean copied AI text and return a polished plain-text version.

Rules:

- Return ONLY the cleaned text.
- Preserve the original meaning and wording.
- Remove markdown formatting.
- Remove code block wrappers.
- Remove unnecessary quotation marks.
- Remove phrases like "Here is your answer" or AI introductions.
- Remove strange spacing and formatting artifacts.
- Do not summarize.
- Do not rewrite the content.
- Do not change the author's tone.

Output only the cleaned text.
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
    onRequestUnlimited(promptText, input, (output) => setOutput(output));
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    alert(data.message || "Something went wrong. Please try again.");
    return;
  }

  setOutput(data.output);
} catch (error) {
  console.error("Request failed:", error);
  setOutput("Something went wrong generating a response. Please try again.");
}
      });
  };

  return (
    <div>
      <Helmet>
        <title>{TOOL_METADATA.cleaner.title}</title>

        <meta
          name="description"
          content={TOOL_METADATA.cleaner.description}
        />

        <link
          rel="canonical"
          href={`https://lazysuite-mini-mall.vercel.app${TOOL_METADATA.cleaner.canonical}`}
        />

        <meta
          property="og:title"
          content={TOOL_METADATA.cleaner.title}
        />

        <meta
          property="og:description"
          content={TOOL_METADATA.cleaner.description}
        />
      </Helmet>
      <h2 className="tool-header-title">ChatGPT Formatting Cleaner</h2>
      <RunsBadge remainingRuns={remainingRuns} />
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste text from ChatGPT with annoying grey background boxes here..."
        className="textarea-input"
        style={{ marginTop: '12px' }}
      />
      <button
        onClick={handleGenerate}
        disabled={remainingRuns > 0 && !input}
        className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
      >
        {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : "Clean Text & Refresh Layout"}
      </button>
      {output && (
        <div className="output-box">

          <div className="output-header">
            <span>Cleaned Text</span>

            <button
              className="copy-button"
              onClick={copyOutput}
            >
              {copied
                ? <Check size={18} />
                : <Copy size={18} />
              }
            </button>

          </div>

          <div className="output-content">
            {output}
          </div>

        </div>
      )}
    </div>
  );
}