import { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function TextHumanizer({ triggerProcess }: ToolProps) {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleGenerate = async () => {
    if (!input) return;

    triggerProcess("Streaming organic language syntax models across serverless rails...", async () => {
      const promptText = "Act as an expert copywriter. Take the user sentence block below and rewrite it to make it sound incredibly natural, engaging, and organic. Remove all rigid robotic phrasing, repetitive transitions, or AI giveaways. Match authentic human speech flows. Maintain the core meaning.";

      try {
        const response = await fetch('/api/run-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptInstructions: promptText, userInput: input })
        });

        const responseText = await response.text();

        console.log("Raw API Response:", responseText);

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

        if (!response.ok) {
          alert(data.message || "Something went wrong. Please try again.");
          return;
        }

        setOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
      
        if (error instanceof Error) {
          setOutput(error.message);
        } else {
          setOutput("Unknown error");
        }
      }
    });
  };

  return (
    <div>
      <h2 className="tool-header-title">AI Text Humanizer</h2>
      <p className="tool-header-seo">Target SEO: "Free AI text humanizer no subscription"</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste sentence loops here to watch the edge processor humanize them in real-time..."
        className="textarea-input"
      />
      <button onClick={handleGenerate} disabled={!input} className="btn-generate">
        Breathe Organic Speech Into String
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}
