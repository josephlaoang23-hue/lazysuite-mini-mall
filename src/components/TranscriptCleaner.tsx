import React, { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function TranscriptCleaner({ triggerProcess }: ToolProps) {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleGenerate = async () => {
    if (!input) return;

    triggerProcess("Sorting timestamp timelines and distilling chat blocks via serverless filters...", async () => {
      const promptText = "You are an advanced secretary. Take this chaotic, raw meeting transcript containing timestamps, speaker markers, or messy logs. Strip out the timestamps entirely, clean up broken sentences, and distill everything into a beautifully structured, highly readable summary with clear bulleted action items.";

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
      <h2 className="tool-header-title">Intelligent Transcript Structurer</h2>
      <p className="tool-header-seo">Target SEO: "Clean raw Zoom Teams transcript text online"</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste messy transcript log files containing raw timestate metrics here..."
        className="textarea-input"
      />
      <button onClick={handleGenerate} disabled={!input} className="btn-generate">
        Extract Core Meeting Actions
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}
