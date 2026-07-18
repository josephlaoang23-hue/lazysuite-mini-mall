import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

const TOOL_METADATA = {
  title: "Free Transcript Cleaner & Meeting Summarizer",
  description:
    "Clean messy meeting transcripts from Zoom, Teams, or Google Meet. Remove timestamps and generate organized summaries with action items.",
  canonicalUrl:
    "https://lazysuite-mini-mall.vercel.app/transcript-cleaner",
};

export default function TranscriptCleaner({
  triggerProcess,
}: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input) return;

    triggerProcess(
      "Sorting timestamp timelines and distilling chat blocks...",
      async () => {
        const promptText = `
You are an AI meeting assistant.

Take the user's raw transcript and:

- Remove timestamps.
- Remove speaker labels unless needed.
- Fix broken sentences.
- Preserve important discussion.
- Produce a clean meeting summary.
- End with clear action items.

Do not invent information.
`;

        try {
          const response = await fetch("/api/run-tool", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              promptInstructions: promptText,
              userInput: input,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            alert(data.message || "Something went wrong.");
            return;
          }

          setOutput(data.output);
        } catch (error) {
          console.error(error);
          setOutput("Something went wrong generating a response.");
        }
      }
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <>
      <Helmet>
        <title>{TOOL_METADATA.title}</title>
        <meta
          name="description"
          content={TOOL_METADATA.description}
        />
        <link
          rel="canonical"
          href={TOOL_METADATA.canonicalUrl}
        />
        <meta
          property="og:title"
          content={TOOL_METADATA.title}
        />
        <meta
          property="og:description"
          content={TOOL_METADATA.description}
        />
      </Helmet>

      <div>
        <h2 className="tool-header-title">
          Intelligent Transcript Structurer
        </h2>

        <p className="tool-header-description">
          Clean messy meeting transcripts into organized summaries and
          actionable notes.
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a Zoom, Teams, Google Meet, or interview transcript here..."
          className="textarea-input"
        />

        <button
          onClick={handleGenerate}
          disabled={!input}
          className="btn-generate"
        >
          Extract Core Meeting Actions
        </button>

        {output && (
          <div className="output-box">
            <div className="output-header">
              <span>Meeting Summary</span>

              <button
                onClick={handleCopy}
                className="copy-btn"
                title="Copy"
              >
                {copied ? (
                  <Check size={18} />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.8,
              }}
            >
              {output}
            </div>
          </div>
        )}
      </div>
    </>
  );
}