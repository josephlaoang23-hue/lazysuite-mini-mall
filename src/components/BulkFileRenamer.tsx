import React, { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function BulkFileRenamer({ triggerProcess }: ToolProps) {
  const [instructions, setInstructions] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleGenerate = async () => {
    if (!instructions) return;

    triggerProcess("Generating contextual renaming maps from serverless logic arrays...", async () => {
      const promptText = "The user wants to rename a batch of raw asset files inside an archive. Take their instructions and generate a clean mapping output layout list showing how an automated system would map old names (like DSC_001.jpg) to pristine, descriptive names based on their rule.";

      try {
        const response = await fetch('/api/run-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptInstructions: promptText, userInput: instructions })
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
      <h2 className="tool-header-title">AI Contextual Bulk File Renamer</h2>
      <p className="tool-header-seo">Target SEO: "Bulk rename files in ZIP folder free"</p>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="e.g., Look inside images and rename them product_angle based on orientation..."
        className="textarea-input"
      />
      <button onClick={handleGenerate} disabled={!instructions} className="btn-generate">
        Execute Intelligent Renaming Sequence
      </button>
      {output && <div className="output-box" style={{ fontFamily: 'monospace' }}>{output}</div>}
    </div>
  );
}
