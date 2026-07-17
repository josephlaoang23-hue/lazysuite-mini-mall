import React, { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function TextHumanizer({ triggerProcess }: ToolProps) {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleGenerate = () => {
    if (!input) return;
    triggerProcess("Injecting optimization tokens into Gemini allocation metrics...", () => {
      setOutput("Look, I know how hard it can be to scale when you run low on time. That is exactly why we built this automated utility loop for you.");
    });
  };

  return (
    <div>
      <h2 className="tool-header-title">AI Text Humanizer</h2>
      <p className="tool-header-seo">Target SEO: "Free AI text humanizer no subscription"</p>
      <textarea 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste robotic AI sentences here..." 
        className="textarea-input"
      />
      <button onClick={handleGenerate} disabled={!input} className="btn-generate">
        Breathe Organic Speech Into String
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}
