import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";

import RunsBadge from "../../components/RunsBadge";

const seo = TOOL_METADATA.renamer;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void; // ← this line
}

interface FilePreview {
  handle: any;
  oldName: string;
  newName: string;
}

export default function BulkFileRenamer({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {

  const [files, setFiles] = useState<FilePreview[]>([]);

  const [renameComplete, setRenameComplete] = useState(false);

  const [instructions, setInstructions] = useState(
    `Rename everything using snake_case.

Remove words like final and copy.

Make names descriptive.`
  );

  const [loading, setLoading] = useState(false);

  const cleanFilename = (name: string) => {

    const dot = name.lastIndexOf(".");

    const filename =
      dot === -1 ? name : name.substring(0, dot);

    const extension =
      dot === -1 ? "" : name.substring(dot).toLowerCase();

    const cleaned = filename
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/copy\s*\(\d+\)|copy/gi, "")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    return cleaned + extension;
  };

  const selectFolder = async () => {

    try {

      setRenameComplete(false);

      setLoading(true);

      const folderHandle =
        await (window as any).showDirectoryPicker();

      triggerProcess(
        "Reading filenames...",
        async () => {

          const loadedFiles: FilePreview[] = [];

          for await (const [name, handle] of folderHandle.entries()) {

            if (handle.kind === "file") {

              loadedFiles.push({

                handle,

                oldName: name,

                newName: cleanFilename(name)

              });

            }

          }

          setFiles(loadedFiles);

          setLoading(false);

        }

      );

    } catch (error) {

      console.error(error);

      setLoading(false);

    }

  };

  const runAI = async () => {

    if (files.length === 0) {
      alert("Please select a folder first.");
      return;
    }
  
    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }
  
    const names = files.map(file => file.oldName);
  
    const promptInstructions = `
  You are a professional file renaming assistant.
  
  Return ONLY JSON.
  
  Format:
  
  [
   {
    "old":"original filename",
    "new":"new filename"
   }
  ]
  
  Rules:
  
  ${instructions}
  
  Keep file extensions.
  Keep the same file order.
  `;
  
    const applyRenameResult = (output: string) => {
      const result = JSON.parse(output);
      setFiles(prev =>
        prev.map(file => {
          const match = result.find((item: any) => item.old === file.oldName);
          return { ...file, newName: match ? match.new : file.newName };
        })
      );
    };
  
    try {
  
      setLoading(true);
  
      const response = await fetch("/api/run-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptInstructions, userInput: JSON.stringify(names) })
      });
  
      const limitRemaining = response.headers.get('X-RateLimit-Remaining');
      if (limitRemaining !== null) {
        onUpdateRemaining(Number(limitRemaining));
      }
  
      if (response.status === 202) {
        onRequestUnlimited(promptInstructions, JSON.stringify(names), applyRenameResult);
        return;
      }
  
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.message || "AI generation failed.");
        return;
      }
  
      if (!data.output) {
        throw new Error("No AI output received.");
      }
  
      applyRenameResult(data.output);
  
    } catch (error) {
      console.error(error);
      alert("AI generation failed.");
    } finally {
      setLoading(false);
    }
  
  };

  const applyRename = async () => {

    try {

      for (const file of files) {

        if (file.oldName !== file.newName) {

          await file.handle.move(file.newName);

        }

      }

      setFiles([]);

      setRenameComplete(true);

    } catch (error) {

      console.error(error);

      alert("Rename failed.");

    }

  };

  return (

    <div>

      <Helmet>

        <title>
          {seo.title}
        </title>

        <meta
          name="description"
          content={seo.description}
        />

        <link
          rel="canonical"
          href={seo.canonical}
        />

      </Helmet>

      <h2 className="tool-header-title">

        Bulk File Renamer

      </h2>

      <RunsBadge remainingRuns={remainingRuns} />

      <p

        style={{

          fontSize: "12px",

          color: "#94a3b8",

          margin: "8px 0 16px 0"

        }}

      >

        Select a folder, describe your rename rules, then let AI generate new filenames.

      </p>

      <textarea

        className="textarea-input"

        value={instructions}

        onChange={(e) => setInstructions(e.target.value)}

        style={{

          height: "100px",

          marginBottom: "16px"

        }}

      />

      <button

        className="btn-generate"

        onClick={selectFolder}

        disabled={loading}

      >

        {loading ? "Loading..." : "Select Folder"}

      </button>

      <button

          onClick={runAI}

          disabled={remainingRuns > 0 ? (loading || files.length === 0) : loading}

          className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}

          style={{

            marginTop: "12px"

          }}

        >

        {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : "Generate AI Names"}

      </button>

      {renameComplete ? (

        <div

          className="output-box"

          style={{

            marginTop: "20px",

            textAlign: "center",

            color: "#2dd4bf",

            fontWeight: "bold"

          }}

        >

          Renamed Successfully!

        </div>

      ) : (

        <>

          {files.length > 0 && (

            <div

              className="output-box"

              style={{

                marginTop: "20px"

              }}

            >

              {files.map((file, index) => (

                <div

                  key={index}

                  style={{

                    padding: "12px 0",

                    borderBottom: "1px solid #1e293b",

                    fontSize: "12px"

                  }}

                >

                  <div

                    style={{

                      color: "#cbd5e1"

                    }}

                  >

                    <strong>

                      Current:

                    </strong>

                    <br />

                    {file.oldName}

                  </div>

                  <div

                    style={{

                      borderTop: "1px solid #334155",

                      margin: "8px 0"

                    }}

                  />

                  <div

                    style={{

                      color: "#2dd4bf"

                    }}

                  >

                    <strong>

                      New:

                    </strong>

                    <br />

                    {file.newName}

                  </div>

                </div>

              ))}

            </div>

          )}

          {files.length > 0 && (

            <button

              className="btn-generate"

              onClick={applyRename}

              style={{

                marginTop: "16px"

              }}

            >

              Apply Rename

            </button>

          )}

        </>

      )}

    </div>

  );

}