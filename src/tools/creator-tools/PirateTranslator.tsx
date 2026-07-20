import { useState } from "react";
import RunsBadge from "../../components/RunsBadge";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/PirateTranslator.css";
interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

export default function PirateTranslator({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runTranslator = () => {

    if (!input.trim()) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }


    const promptInstructions = `
You are a pirate translator.

Convert the user's text into authentic pirate speech.

Rules:
- Keep the original meaning.
- Use pirate vocabulary.
- Return only the translated text.
`;

triggerProcess(
  "Translating input into pirate language...",
  async () => {
    setIsLoading(true);
    try {

      const response = await fetch("/api/run-tool", {

        method: "POST",
      
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": getDeviceId()
        },
      
        body: JSON.stringify({
          promptInstructions,
          userInput: input,
          toolId: 'pirate'
        })
      
      });

          const limitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (limitRemaining !== null) {
            onUpdateRemaining(Number(limitRemaining));
          }

          if (response.status === 202) {
            onRequestUnlimited(promptInstructions, input, (output) => setOutput(output));
            return;
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

        } finally {
          setIsLoading(false);
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

      disabled={remainingRuns > 0 && !input.trim()}

      >

      {remainingRuns === 0
        ? "Limit Exhausted – Click to Unlock"
        : isLoading
          ? "⏳ Translating..."
          : "Translate"}

      </button>

      {output && (

      <div className="output-box">

        {output}

      </div>

      )}

      {output && <AdsterraNativeBanner />}

</div>

);

}