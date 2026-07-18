import { useState } from "react";
import { triggerPopunderAd } from "../../ads/adManager";
interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function PirateTranslator({
  triggerProcess
}: ToolProps) {

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const runTranslator = () => {

    if (!input.trim()) return;

    triggerPopunderAd();

    triggerProcess(
      "Translating input into pirate language...",
      async () => {

        try {

          const response = await fetch("/api/run-tool", {

            method: "POST",

            headers:{
              "Content-Type":"application/json"
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


          const data = await response.json();


          setOutput(data.output || "No response generated.");


        } catch(error){

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


      <textarea

        className="textarea-input"

        value={input}

        onChange={(e)=>setInput(e.target.value)}

        placeholder="Enter text to translate..."

      />


      <button

        className="btn-generate"

        onClick={runTranslator}

      >

        Translate

      </button>



      {output && (

        <div className="output-box">

          {output}

        </div>

      )}


    </div>

  );

}