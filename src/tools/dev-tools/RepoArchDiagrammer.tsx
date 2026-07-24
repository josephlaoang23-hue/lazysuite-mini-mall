import { useState, useRef } from "react";
import JSZip from "jszip";
import mermaid from "mermaid";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/RepoArchDiagrammer.css";

const seo = TOOL_METADATA.repoarch;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface LoadedFile {
  name: string;
  content: string;
}

const MAX_FILES = 10;
const MAX_TOTAL_CHARS = 60000; // keeps the prompt payload reasonable

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: "#0f172a",
    primaryColor: "#1e293b",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#2dd4bf",
    lineColor: "#2dd4bf",
    secondaryColor: "#020617",
    tertiaryColor: "#020617"
  }
});

// Skip binary/irrelevant files a zip might contain — we only want readable source code
const SKIPPABLE_PATTERNS = [
  "node_modules/", ".git/", ".png", ".jpg", ".jpeg", ".gif", ".svg",
  ".ico", ".lock", ".woff", ".ttf", ".mp4", ".zip", ".DS_Store"
];

function isSkippable(path: string): boolean {
  return SKIPPABLE_PATTERNS.some((pattern) => path.includes(pattern));
}

const PROMPT_TEXT = `
You are a senior software architect who reads multiple source code files and maps how they connect into a system architecture diagram.

You will be given several files, each preceded by a "===== FILE: <filename> =====" marker.

Analyze how these files depend on and interact with each other — imports, function calls, API routes being fetched, exports being consumed, components rendering other components, etc.

Output ONLY valid Mermaid.js flowchart syntax representing this architecture.

Rules:
- Start with: flowchart TD
- Use subgraph blocks to group related files logically (e.g. "Frontend", "API Routes", "Utilities") if the structure supports it.
- Each file should appear as its own node, labeled with its filename.
- Draw arrows between files that depend on or call each other, with short labels describing the relationship (e.g. "fetches from", "imports", "renders").
- If a file's role is unclear, make a reasonable best-effort label based on its name and content.
- Do NOT include markdown code fences (no triple backticks).
- Do NOT include any explanation or text outside the Mermaid syntax.
- Output ONLY the raw Mermaid flowchart code, nothing else.
`;

export default function RepoArchDiagrammer({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [loadError, setLoadError] = useState<string>("");
  const [isReadingZip, setIsReadingZip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [svgOutput, setSvgOutput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showRawCode, setShowRawCode] = useState(false);
  const [copiedReadme, setCopiedReadme] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderCounter = useRef(0);

  const resetOutput = () => {
    setSvgOutput("");
    setMermaidCode("");
    setErrorMsg("");
  };

  const addFiles = (newFiles: LoadedFile[]) => {
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > MAX_FILES) {
        setLoadError(`Only the first ${MAX_FILES} files are used — you added more than that, so the rest were skipped.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const handleZipUpload = async (file: File) => {
    setLoadError("");
    setIsReadingZip(true);
    resetOutput();

    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter(
        (entry) => !entry.dir && !isSkippable(entry.name)
      );

      if (entries.length === 0) {
        setLoadError("No readable source files were found inside that zip.");
        setIsReadingZip(false);
        return;
      }

      const extracted: LoadedFile[] = [];
      for (const entry of entries.slice(0, MAX_FILES)) {
        const content = await entry.async("text");
        extracted.push({ name: entry.name, content });
      }

      addFiles(extracted);
    } catch (err) {
      console.error("Zip extraction failed:", err);
      setLoadError("Couldn't read that zip file. Please make sure it's a valid .zip archive.");
    } finally {
      setIsReadingZip(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleIndividualFiles = async (fileList: FileList) => {
    setLoadError("");
    resetOutput();

    const extracted: LoadedFile[] = [];
    for (const file of Array.from(fileList)) {
      if (file.name.endsWith(".zip")) {
        await handleZipUpload(file);
        continue;
      }
      const content = await file.text();
      extracted.push({ name: file.name, content });
    }

    if (extracted.length > 0) {
      addFiles(extracted);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIndividualFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIndividualFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const clearAll = () => {
    setFiles([]);
    resetOutput();
    setLoadError("");
  };

  const buildCombinedPayload = (): string => {
    let combined = "";
    let charCount = 0;

    for (const file of files) {
      const block = `\n\n===== FILE: ${file.name} =====\n${file.content}`;
      if (charCount + block.length > MAX_TOTAL_CHARS) {
        combined += `\n\n[Remaining files truncated to stay within processing limits]`;
        break;
      }
      combined += block;
      charCount += block.length;
    }

    return combined.trim();
  };

  const renderDiagram = async (code: string) => {
    try {
      renderCounter.current += 1;
      const uniqueId = `repo-arch-${renderCounter.current}`;
      const { svg } = await mermaid.render(uniqueId, code);
      setSvgOutput(svg);
      setErrorMsg("");
    } catch (err) {
      console.error("Mermaid render failed:", err);
      setErrorMsg(
        "The AI's diagram had a formatting issue and couldn't be drawn. You can view the raw output below and try again."
      );
      setSvgOutput("");
      setShowRawCode(true);
    }
  };

  const handleAiOutput = async (rawOutput: string) => {
    const cleaned = rawOutput
      .replace(/```mermaid/gi, "")
      .replace(/```/g, "")
      .trim();

    setMermaidCode(cleaned);
    await renderDiagram(cleaned);
  };

  const handleMapArchitecture = async () => {
    if (files.length === 0) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    resetOutput();

    triggerProcess("Mapping how your files connect into an architecture diagram...", async () => {
      setIsLoading(true);

      const userInput = buildCombinedPayload();

      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT_TEXT, userInput, toolId: "repoarch" })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) {
          onUpdateRemaining(Number(limitRemaining));
        }

        if (response.status === 202) {
          onRequestUnlimited(PROMPT_TEXT, userInput, handleAiOutput);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong mapping the architecture. Please try again.");
          return;
        }

        await handleAiOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong mapping the architecture. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  const copyForReadme = async () => {
    const readmeBlock = "```mermaid\n" + mermaidCode + "\n```";
    await navigator.clipboard.writeText(readmeBlock);
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
      </Helmet>

      <ToolLayout
        controls={
          <>
            <h2 className="tool-header-title">Repo-to-Architecture Diagram Maker</h2>
            <p className="tool-header-seo">
              Drop in a few core code files or a zipped project folder — see how everything connects as a visual architecture diagram.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            <div
              className="repo-drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip,.js,.jsx,.ts,.tsx,.py,.java,.go,.rb,.php,.css,.html,.json"
                onChange={handleFileInputChange}
                className="repo-file-input-hidden"
              />
              <p className="repo-drop-text">
                {isReadingZip
                  ? "Reading zip contents..."
                  : "Drag & drop 3–10 code files, or a .zip of your project — or click to browse"}
              </p>
            </div>

            {loadError && <p className="audio-file-error">{loadError}</p>}

            {files.length > 0 && (
              <div className="repo-file-list">
                <div className="repo-file-list-header">
                  <span>{files.length} file{files.length !== 1 ? "s" : ""} loaded</span>
                  <button className="copy-button" onClick={clearAll}>Clear All</button>
                </div>
                {files.map((f) => (
                  <div key={f.name} className="repo-file-chip">
                    <span>{f.name}</span>
                    <button onClick={() => removeFile(f.name)} title="Remove">✕</button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleMapArchitecture}
              disabled={files.length === 0 || isLoading}
              className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
            >
              {remainingRuns === 0
                ? "Limit Exhausted – Click to Unlock"
                : isLoading
                  ? "⏳ Mapping Architecture..."
                  : "Map Architecture"}
            </button>

            {errorMsg && (
              <div className="output-box" style={{ borderColor: "#ef4444", color: "#f87171" }}>
                {errorMsg}
              </div>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>See how your codebase actually connects</h2>
              <p>Drop in a handful of source files or a zipped project, and this tool traces the real imports, function calls, and dependencies between them — turning a messy codebase into a clear architecture diagram you can drop straight into a README.</p>
            </section>
          </>
        }
        canvas={
          svgOutput ? (
            <div className="repo-arch-output">
              <div className="output-header">
                <span>Architecture Diagram</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="copy-button" onClick={copyForReadme} title="Copy for GitHub README">
                    {copiedReadme ? <Check size={16} /> : <Copy size={16} />} Copy for README
                  </button>
                  <button className="copy-button" onClick={() => setShowRawCode(!showRawCode)}>
                    {showRawCode ? "Hide Raw" : "View Raw"}
                  </button>
                </div>
              </div>

              <div className="repo-arch-diagram" dangerouslySetInnerHTML={{ __html: svgOutput }} />

              {showRawCode && <pre className="logic-map-raw">{mermaidCode}</pre>}
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
              Your architecture diagram will appear here once generated.
            </p>
          )
        }
      />
    </>
  );
}