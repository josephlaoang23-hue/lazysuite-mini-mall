import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";

import RunsBadge from "../../components/RunsBadge";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/BulkFileRenamer.css";
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

  const MAX_FILES = 20;

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

  const supportsFolderPicker =
    typeof (window as any).showDirectoryPicker === "function";

    const [skippedCount, setSkippedCount] = useState(0);

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
  
            const capped = loadedFiles.slice(0, MAX_FILES);
            setSkippedCount(Math.max(0, loadedFiles.length - MAX_FILES));
            setFiles(capped);
            setLoading(false);
  
          }
  
        );
  
      } catch (error) {
  
        console.error(error);
  
        setLoading(false);
  
      }
  
    };
  
    const selectIndividualFiles = (fileList: FileList) => {
  
      setRenameComplete(false);
  
      const allFiles = Array.from(fileList);
      const capped = allFiles.slice(0, MAX_FILES);
      setSkippedCount(Math.max(0, allFiles.length - MAX_FILES));
  
      const loadedFiles: FilePreview[] = capped.map((file) => ({
        handle: file, // a plain File object here — no in-place rename capability
        oldName: file.name,
        newName: cleanFilename(file.name)
      }));
  
      setFiles(loadedFiles);
  
    };
  
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        selectIndividualFiles(e.target.files);
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
        headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
        body: JSON.stringify({ promptInstructions, userInput: JSON.stringify(names), toolId: 'renamer' })
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

          // showDirectoryPicker gives real FileSystemFileHandle objects, which support .move()
          if (typeof file.handle.move === "function") {
            await file.handle.move(file.newName);
          }

        }

      }

      setFiles([]);

      setRenameComplete(true);

    } catch (error) {

      console.error(error);

      alert("Rename failed.");

    }

  };

  const downloadRenamedFiles = () => {

    files.forEach((file) => {
      // file.handle is a plain browser File object in this path (from <input>, not showDirectoryPicker)
      const rawFile: File = file.handle;
      const url = URL.createObjectURL(rawFile);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.newName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    setFiles([]);
    setRenameComplete(true);

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

{supportsFolderPicker ? (
        <button
          className="btn-generate"
          onClick={selectFolder}
          disabled={loading}
        >
          {loading ? "Loading..." : "Select Folder"}
        </button>
      ) : (
        <>
          <input
            type="file"
            multiple
            onChange={handleFileInputChange}
            style={{ display: "none" }}
            id="renamer-file-input"
          />
          <label htmlFor="renamer-file-input" className="btn-generate" style={{ display: "block", textAlign: "center", cursor: "pointer" }}>
            Select Files
          </label>
        </>
      )}

      {skippedCount > 0 && (
        <p style={{ fontSize: "11px", color: "#fbbf24", margin: "8px 0 0 0" }}>
          Only the first {MAX_FILES} files were loaded — {skippedCount} additional file{skippedCount !== 1 ? "s were" : " was"} skipped.
        </p>
      )}

      <button

        onClick={runAI}

        disabled={remainingRuns > 0 ? (loading || files.length === 0) : loading}

        className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}

        style={{

          marginTop: "12px"

        }}

      >

        {remainingRuns === 0
          ? "Limit Exhausted – Click to Unlock"
          : loading
            ? "⏳ Renaming..."
            : "Generate AI Names"}

      </button>

      {renameComplete ? (

<div className="output-box renamer-success-box">

  Renamed Successfully!

</div>

) : (

<>

  {files.length > 0 && (

    <div className="output-box renamer-file-list">

      {files.map((file, index) => (

        <div key={index} className="renamer-file-row">

          <div className="renamer-file-current">

            <strong>

              Current:

            </strong>

            <br />

            {file.oldName}

          </div>

          <div className="renamer-file-divider" />

          <div className="renamer-file-new">

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
  className="btn-generate renamer-apply-btn"
  onClick={supportsFolderPicker ? applyRename : downloadRenamedFiles}
>
  {supportsFolderPicker ? "Apply Rename" : "Download Renamed Files"}
</button>

)}

</>

)}

{renameComplete && <AdsterraNativeBanner />}

<AdsterraNativeBanner />

<section className="tool-seo-section">
<h2>Batch rename files in your browser for free</h2>
<p>Renaming dozens or hundreds of files one at a time is slow and error-prone. This tool reads your folder, lets you describe rename rules in plain English, and generates consistent new filenames instantly — all inside your browser, with no software installation or file uploads required.</p>

<h2>How to change multiple file extensions or naming patterns at once</h2>
<p>Whether you're cleaning up snake_case naming, stripping words like "final" or "copy," or organizing media assets for a project, this renamer applies your instructions across every file in the selected folder in one pass, keeping file extensions and order intact.</p>
</section>

</div>

);

}