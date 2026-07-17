import React, { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function ChatGptCleaner({ triggerProcess }: ToolProps) {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleGenerate = () => {
    if (!input) return;
    triggerProcess("Stripping grey markdown highlight artifacts...", () => {
      let cleaned = input.replace(/```[a-z]*\n?/gi, '').replace(/`/g, '').replace(/■/g, '');
      setOutput(cleaned.trim());
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
