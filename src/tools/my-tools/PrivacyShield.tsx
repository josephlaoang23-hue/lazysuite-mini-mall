import { useState, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import exifr from "exifr";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/PrivacyShield.css";

const seo = TOOL_METADATA.privacyshield;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface ExtractedMetadata {
  gps: string | null;
  cameraModel: string | null;
  make: string | null;
  timestamp: string | null;
  software: string | null;
  hasAnyMetadata: boolean;
}

export default function PrivacyShield({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgedUrl, setPurgedUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetState = () => {
    setMetadata(null);
    setAiSummary("");
    setPurgedUrl("");
  };

  const handleFileSelect = async (file: File) => {
    resetState();
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));

    // Real metadata extraction — actual EXIF bytes read from the file itself
    try {
      const raw = await exifr.parse(file, { gps: true });
      const extracted: ExtractedMetadata = {
        gps: raw?.latitude && raw?.longitude
          ? `${raw.latitude.toFixed(5)}, ${raw.longitude.toFixed(5)}`
          : null,
        cameraModel: raw?.Model || null,
        make: raw?.Make || null,
        timestamp: raw?.DateTimeOriginal
          ? new Date(raw.DateTimeOriginal).toLocaleString()
          : null,
        software: raw?.Software || null,
        hasAnyMetadata: !!(raw?.latitude || raw?.Model || raw?.Make || raw?.DateTimeOriginal || raw?.Software)
      };
      setMetadata(extracted);
    } catch (err) {
      console.error("EXIF parse failed:", err);
      setMetadata({
        gps: null, cameraModel: null, make: null, timestamp: null, software: null, hasAnyMetadata: false
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateSummary = async () => {
    if (!imageFile || !metadata) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    triggerProcess("Analyzing your image and writing a privacy report...", async () => {
      setIsScanning(true);

      const foundList = [
        metadata.gps && `GPS coordinates: ${metadata.gps}`,
        metadata.cameraModel && `Camera model: ${metadata.cameraModel}`,
        metadata.make && `Device manufacturer: ${metadata.make}`,
        metadata.timestamp && `Timestamp: ${metadata.timestamp}`,
        metadata.software && `Software tag: ${metadata.software}`
      ].filter(Boolean).join("\n");

      const promptText = `
You are a privacy analysis assistant. Here is the REAL metadata that was actually extracted from a user's image file:

${foundList || "No identifying metadata was found in this file."}

Write a short, friendly privacy report explaining what this metadata reveals about the person (if anything), in plain language a non-technical person would understand.

Rules:
- Only discuss the metadata listed above. Do not invent or guess at additional details.
- If no metadata was found, clearly and reassuringly say so.
- End with one sentence recommending they use the "Purge Tags" button if any metadata was found.
- Keep it under 120 words.
- Do not use markdown formatting.
`;

      try {
        const imageBase64 = await fileToBase64(imageFile);

        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions: promptText,
            imageBase64,
            mimeType: imageFile.type,
            toolId: "privacyshield"
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) {
          onUpdateRemaining(Number(limitRemaining));
        }

        if (response.status === 202) {
          // NOTE: the unlimited-mode backend endpoint does not currently accept
          // image data — only text. This branch matches the required frontend
          // pattern, but won't actually re-analyze the image until the backend
          // gains image support for unlimited-mode runs.
          onRequestUnlimited(promptText, foundList, (output) => setAiSummary(output));
          setIsScanning(false);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Something went wrong. Please try again.");
          setIsScanning(false);
          return;
        }

        setAiSummary(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setAiSummary("Something went wrong generating the report. Please try again.");
      } finally {
        setIsScanning(false);
      }
    });
  };

  // Real, working purge: redrawing onto a canvas and re-exporting strips EXIF automatically.
  const purgeTags = () => {
    if (!imageFile || !canvasRef.current) return;
    setIsPurging(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsPurging(false);
        return;
      }
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const cleanUrl = URL.createObjectURL(blob);
          setPurgedUrl(cleanUrl);
        }
        setIsPurging(false);
      }, imageFile.type === "image/png" ? "image/png" : "image/jpeg", 0.95);
    };
    img.src = imagePreviewUrl;
  };

  const copySummary = async () => {
    await navigator.clipboard.writeText(aiSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setImageFile(null);
    setImagePreviewUrl("");
    resetState();
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            <h2 className="tool-header-title">Metadata Privacy Shield & Tag Purger</h2>
            <p className="tool-header-seo">
              Upload a real photo to see exactly what hidden metadata it contains, and remove it for free.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            {!imageFile ? (
              <div
                className="privacy-drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleInputChange}
                  className="repo-file-input-hidden"
                />
                <p className="repo-drop-text">
                  Drag & drop a photo here, or click to browse (.png, .jpg, .webp)
                </p>
              </div>
            ) : (
              <div className="privacy-preview-info">
                <p className="audio-file-name">✓ {imageFile.name}</p>
                <button className="copy-button" onClick={clearAll}>Remove</button>
              </div>
            )}

            {imageFile && (
              <button
                onClick={generateSummary}
                disabled={isScanning}
                className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
              >
                {remainingRuns === 0
                  ? "Limit Exhausted – Click to Unlock"
                  : isScanning
                    ? "⏳ Generating Report..."
                    : "Generate Privacy Report"}
              </button>
            )}

            {metadata?.hasAnyMetadata && (
              <button onClick={purgeTags} disabled={isPurging} className="btn-generate" style={{ marginTop: "12px" }}>
                {isPurging ? "⏳ Purging..." : "Purge Tags"}
              </button>
            )}

            {purgedUrl && (
              <div className="privacy-purged-result">
                <p className="audio-file-name">✓ Clean version ready — all metadata stripped.</p>
                <a href={purgedUrl} download={`clean_${imageFile?.name || "image.jpg"}`} className="btn-generate" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                  Download Clean Image
                </a>
              </div>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>See exactly what your photos reveal about you</h2>
              <p>Photos carry hidden EXIF metadata — GPS coordinates, camera model, timestamps — that most people never see. This tool scans the real metadata in your file, explains it in plain language, and strips it out with one click.</p>
            </section>
          </>
        }
        canvas={
          <>
            {imagePreviewUrl && (
              <div className="privacy-preview-card">
                <img src={imagePreviewUrl} alt="Uploaded preview" className="privacy-preview-img" />
              </div>
            )}

            {metadata && (
              <div className="privacy-checklist">
                <h3 className="privacy-checklist-title">Metadata Found</h3>

                <div className={`privacy-check-row ${metadata.gps ? "found" : "clear"}`}>
                  <span>GPS Coordinates</span>
                  <span>{metadata.gps ? `⚠️ Found — ${metadata.gps}` : "✓ None found"}</span>
                </div>
                <div className={`privacy-check-row ${metadata.cameraModel ? "found" : "clear"}`}>
                  <span>Camera Model</span>
                  <span>{metadata.cameraModel ? `⚠️ Found — ${metadata.cameraModel}` : "✓ None found"}</span>
                </div>
                <div className={`privacy-check-row ${metadata.make ? "found" : "clear"}`}>
                  <span>Device Manufacturer</span>
                  <span>{metadata.make ? `⚠️ Found — ${metadata.make}` : "✓ None found"}</span>
                </div>
                <div className={`privacy-check-row ${metadata.timestamp ? "found" : "clear"}`}>
                  <span>Timestamp</span>
                  <span>{metadata.timestamp ? `⚠️ Found — ${metadata.timestamp}` : "✓ None found"}</span>
                </div>
              </div>
            )}

            {aiSummary && (
              <div className="output-box" style={{ position: "relative" }}>
                <button className="copy-button" onClick={copySummary} style={{ position: "absolute", top: "12px", right: "12px" }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                {aiSummary}
              </div>
            )}

            {!imagePreviewUrl && (
              <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
                Your image preview and privacy report will appear here.
              </p>
            )}
          </>
        }
      />

      {/* Hidden canvas used purely for the purge operation, never shown to the user */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}