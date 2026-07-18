import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function BulkFileRenamer({ triggerProcess }: ToolProps) {
  const [instructions, setInstructions] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };


  const handleGenerate = async () => {
    if (!instructions) return;

    triggerProcess(
      "Generating contextual filename transformation maps...",
      async () => {

      const promptText =
        `You are a file renaming assistant.

        Generate only a clean filename mapping table.
        
        Format:
        
        OLD FILE NAME | NEW FILE NAME
        
        Do not add explanations, tutorials, or extra advice.`;

      try {
        const response = await fetch('/api/run-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptInstructions: promptText,
            userInput: instructions
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Something went wrong. Please try again.");
          return;
        }

        setOutput(data.output);

      } catch (error) {
        console.error("Request failed:", error);
        setOutput(
          "Something went wrong generating a response. Please try again."
        );
      }
    });
  };


  return (
    <div>

      <Helmet>
        <title>
          AI Bulk File Renamer | Organize Files Automatically
        </title>

        <meta
          name="description"
          content="Generate smart filename structures and rename plans for large collections of files using AI."
        />

      </Helmet>


      <h2 className="tool-header-title">
        AI Contextual Bulk File Renamer
      </h2>


      <p
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          marginBottom: "16px"
        }}
      >
        Create organized filename structures from simple instructions.
      </p>


      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Example: Rename travel photos using location and date format..."
        className="textarea-input"
      />


      <button
        onClick={handleGenerate}
        disabled={!instructions}
        className="btn-generate"
      >
        Execute Intelligent Renaming Sequence
      </button>


      {output && (
        <div className="output-box"
          style={{
            fontFamily: "monospace",
            position: "relative"
          }}
        >

          <button
            onClick={handleCopy}
            style={{
              position:"absolute",
              right:"12px",
              top:"12px",
              background:"#1e293b",
              border:"none",
              color:"#cbd5e1",
              padding:"6px",
              borderRadius:"6px",
              cursor:"pointer"
            }}
          >
            {copied ? <Check size={16}/> : <Copy size={16}/>}
          </button>


          {output}

        </div>
      )}

    </div>
  );
}