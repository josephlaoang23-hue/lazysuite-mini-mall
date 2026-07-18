import { useState } from "react";
import { Helmet } from "react-helmet-async";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

interface FilePreview {
  handle: any;
  oldName: string;
  newName: string;
}

export default function BulkFileRenamer({ triggerProcess }: ToolProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
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

    let cleaned = filename
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/copy\s*\(\d+\)|copy/gi, "")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    return cleaned + extension;
  };

  const selectFolder = async () => {
    try {
      setLoading(true);
  
      const folderHandle = await (window as any).showDirectoryPicker();
  
      triggerProcess(
        "Reading filenames...",
        async () => {
          const loadedFiles: FilePreview[] = [];
  
          for await (const [name, handle] of folderHandle.entries()) {
            if (handle.kind === "file") {
              loadedFiles.push({
                handle,
                oldName: name,
                newName: cleanFilename(name),
              });
            }
          }
  
          setFiles(loadedFiles);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Bulk File Renamer</title>

        <meta
          name="description"
          content="Clean messy filenames instantly."
        />
      </Helmet>

      <h2 className="tool-header-title">
        Bulk File Renamer
      </h2>

      <p
      style={{
        fontSize: "12px",
        color: "#94a3b8",
        marginBottom: "16px",
      }}
    >
      Select a folder, describe how you want the files renamed, then let AI generate better filenames.
    </p>

    <textarea
      className="textarea-input"
      placeholder="Example: Rename these travel photos using snake_case and descriptive names..."
      value={instructions}
      onChange={(e) => setInstructions(e.target.value)}
      style={{
        marginBottom: "16px",
        height: "100px",
      }}
    />
      <button
        className="btn-generate"
        onClick={selectFolder}
        disabled={loading}
      >
        Select Folder
      </button>

      {files.length > 0 && (
        <div
          className="output-box"
          style={{ marginTop: "20px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              marginBottom: "12px",
              borderBottom: "1px solid #334155",
              paddingBottom: "8px",
            }}
          >
            <span>Current Filename</span>
            <span>New Filename</span>
          </div>

          {files.map((file, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #1e293b",
                fontSize: "12px",
              }}
            >
              <span>{file.oldName}</span>

              <span style={{ color: "#2dd4bf" }}>
                {file.newName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}