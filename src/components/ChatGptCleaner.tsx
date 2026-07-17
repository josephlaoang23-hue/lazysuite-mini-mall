import { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function ChatGptCleaner({ triggerProcess }: ToolProps) {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleGenerate = async () => {
    if (!input) return;

    triggerProcess("Stripping grey markdown highlight artifacts across edge filters...", async () => {
      const promptText = "You are a text clean-up assistant. Clean the text by removing markdown wrappers, raw code indicators, or background-box indicators while preserving the original spoken words exactly.";

      try {
        const response = await fetch('/api/run-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptInstructions: promptText, userInput: input })
        });

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
      <h2 className="tool-header-title">ChatGPT Formatting Cleaner</h2>
      <p className="tool-header-seo">Target SEO: "Fix ChatGPT copy formatting boxes"</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste text from ChatGPT with annoying grey background boxes here..."
        className="textarea-input"
      />
      <button onClick={handleGenerate} disabled={!input} className="btn-generate">
        Clean Text & Refresh Layout
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}