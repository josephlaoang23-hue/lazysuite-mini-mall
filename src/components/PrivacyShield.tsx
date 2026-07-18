import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function PrivacyShield({ triggerProcess }: ToolProps) {
  const [active, setActive] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleGenerate = async () => {
    triggerProcess(
      "Analyzing metadata and generating privacy report...",
      async () => {
        const promptText = `
You are a privacy analysis assistant.

Generate a concise privacy report for a media file.

Include:

• GPS metadata
• Camera model
• Device manufacturer
• Date and time
• EXIF metadata
• File identifiers

For each item, indicate whether it has been removed.

Finish with an overall privacy status.

Do not invent technical details beyond this simulated report.
`;

        try {
          const response = await fetch("/api/run-tool", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              promptInstructions: promptText,
              userInput: "Analyze uploaded demo media."
            }),
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
      }
    );
  };

  return (
    <div>
      <Helmet>
        <title>
          Metadata Privacy Shield | Remove EXIF & GPS Metadata
        </title>

        <meta
          name="description"
          content="Generate a privacy report showing removable metadata such as GPS coordinates, EXIF information, timestamps, and camera details."
        />

        <link
          rel="canonical"
          href="https://lazysuite-mini-mall.vercel.app/privacy-shield"
        />
      </Helmet>

      <h2 className="tool-header-title">
        Metadata Privacy Shield & Tag Purger
      </h2>

      <p
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          marginBottom: "16px",
        }}
      >
        Generate a privacy report showing removable metadata found in media
        files.
      </p>

      <div
        style={{
          padding: "24px",
          border: "2px dashed #1e293b",
          backgroundColor: "rgba(15,23,42,0.4)",
          borderRadius: "12px",
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        {!active ? (
          <button
            onClick={() => setActive(true)}
            className="btn-generate"
            style={{
              marginTop: 0,
              width: "auto",
              padding: "8px 16px",
            }}
          >
            Load Demo Media File
          </button>
        ) : (
          <p
            style={{
              fontSize: "12px",
              color: "#2dd4bf",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            ✓ DJI_0032.MP4 (Metadata Detected)
          </p>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!active}
        className="btn-generate"
      >
        Generate Privacy Report
      </button>

      {output && (
        <div
          className="output-box"
          style={{
            fontFamily: "monospace",
            position: "relative",
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "#1e293b",
              border: "none",
              color: "#cbd5e1",
              padding: "6px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>

          {output}
        </div>
      )}
    </div>
  );
}