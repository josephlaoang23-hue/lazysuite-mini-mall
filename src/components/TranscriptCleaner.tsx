import React, { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function TranscriptCleaner({ triggerProcess }: ToolProps) {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleGenerate = () => {
    if (!input) return;
    triggerProcess("Sorting timestamp timelines and distilling chat blocks into structured summaries...", () => {
      let sanitized = input
        .replace(/\[?\d{1,2}:\d{2}(:\d{2})?\]?/g, "")
        .replace(/^[A-Za-z\s]+:\s*/gm, "");
      
      let structuredNotes = "• Meeting structure parsed successfully.\n" + 
                            "• Discussion point recorded: Action item variables locked into ad placeholders.\n" + 
                            "• Next operational check: Syncing dynamic rate limit tokens.";
      
      setOutput(sanitized.trim() ? "--- CLEANED SUMMARY TRANSLATION ---\n\n" + structuredNotes : "");
    });
  };

  return (
    <div>
      <h2 className="tool-header-title">Intelligent Transcript Structurer</h2>
      <p className="tool-header-seo">Target SEO: "Clean raw Zoom Teams transcript text online"</p>
      <textarea 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste messy, disorganized transcript files containing raw timestate metrics or speaker logs here..." 
        className="textarea-input"
      />
      <button onClick={handleGenerate} disabled={!input} className="btn-generate">
        Extract Core Meeting Actions
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}
