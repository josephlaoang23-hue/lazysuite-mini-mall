import { useState } from "react";
import { triggerPopunderAd } from "../../ads/adManager";
import RunsBadge from "../../components/RunsBadge";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
}

export default function PirateTranslator({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock
}: ToolProps) {

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const runTranslator = () => {

    if (!input.trim()) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    triggerPopunderAd();

    triggerProcess(
      "Translating input into pirate language...",
      async () => {

        try {

          const response = await fetch("/api/run-tool", {

            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({

              promptInstructions:
                `
You are a pirate translator.

Convert the user's text into authentic pirate speech.

Rules:
- Keep the original meaning.
- Use pirate vocabulary.
- Return only the translated text.
`,

              userInput: input

            })

          });

          const limitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (limitRemaining !== null) {
            onUpdateRemaining(Number(limitRemaining));
          }

          const data = await response.json();

          if (!response.ok) {
            setOutput(data.message || "Translation failed.");
            return;
          }

          setOutput(data.output || "No response generated.");

        } catch (error) {

          console.error(error);

          setOutput("Translation failed.");

        }

      }
    );

  };

  return (

    <div>

      <h2 className="tool-header-title">
        Pirate Translator
      </h2>

      <p className="tool-header-seo">
        Converts normal English into classic pirate speech.
      </p>

      <RunsBadge remainingRuns={remainingRuns} />

      <textarea

        className="textarea-input"

        value={input}

        onChange={(e) => setInput(e.target.value)}

        placeholder="Enter text to translate..."

        style={{ marginTop: '12px' }}

      />

      <button

        className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}

        onClick={runTranslator}

        disabled={!input.trim()}

      >

        {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : "Translate"}

      </button>

      {output && (

        <div className="output-box">

          {output}

        </div>

      )}

    </div>

  );

}