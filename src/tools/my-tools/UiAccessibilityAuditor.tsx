import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/UiAccessibilityAuditor.css";

const seo = TOOL_METADATA.uiaccessibility;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface AccessibilityIssue {
  label: string;
  severity: "high" | "medium" | "low";
  description: string;
  approximateLocation: string;
  xPercent: number;
  yPercent: number;
}

interface AuditResult {
  overallImpression: string;
  issues: AccessibilityIssue[];
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#60a5fa"
};

const PROMPT_TEXT = `
You are a UI/UX accessibility reviewer helping designers spot potential issues in a screenshot of a website or app interface.

This is a VISUAL, ADVISORY scan only — not a certified WCAG compliance audit. Do not claim exact contrast ratios or guarantee legal compliance. Describe what you visually observe.

Look for things like:
- Text that appears too small or hard to read
- Text/background color combinations that look low-contrast
- Interactive elements (buttons, links) that seem hard to distinguish from surrounding content
- Cramped spacing or elements that look too close together to tap/click reliably
- Any obvious layout issues that could confuse users

Return ONLY valid JSON matching this EXACT shape, nothing else, no markdown fences, no explanation:

{
  "overallImpression": "2-3 sentence plain-language summary of the interface's general accessibility feel",
  "issues": [
    {
      "label": "Short issue name",
      "severity": "high" | "medium" | "low",
      "description": "1-2 sentence explanation of the issue and a suggested fix",
      "approximateLocation": "Plain description of where this is, e.g. 'top navigation bar' or 'primary call-to-action button'",
      "xPercent": 0-100 (your best visual estimate of the horizontal position of this issue, as a percentage of image width),
      "yPercent": 0-100 (your best visual estimate of the vertical position of this issue, as a percentage of image height)
    }
  ]
}

Rules:
- Include up to 6 of the most important issues. If the interface looks genuinely good, return fewer or an empty array and say so honestly in "overallImpression".
- xPercent/yPercent are rough visual estimates only, not precise pixel measurements.
- Do not state exact WCAG contrast ratios as if measured — describe contrast qualitatively (e.g. "appears low-contrast") instead.
- Output ONLY the raw JSON object, nothing else.
`;

export default function UiAccessibilityAuditor({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetOutput = () => {
    setAudit(null);
    setErrorMsg("");
  };

  const handleFileSelect = (file: File) => {
    resetOutput();
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
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

  const parseAndSetAudit = (rawOutput: string) => {
    const cleaned = rawOutput
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed: AuditResult = JSON.parse(cleaned);
      setAudit(parsed);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr, cleaned);
      setErrorMsg("The AI's response wasn't in the expected format. Please try again.");
    }
  };

  const runAudit = async () => {
    if (!imageFile) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    resetOutput();

    triggerProcess("Scanning your interface for accessibility issues...", async () => {
      setIsScanning(true);

      try {
        const imageBase64 = await fileToBase64(imageFile);

        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions: PROMPT_TEXT,
            imageBase64,
            mimeType: imageFile.type,
            toolId: "uiaccessibility"
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) {
          onUpdateRemaining(Number(limitRemaining));
        }

        if (response.status === 202) {
          // NOTE: same limitation as PrivacyShield — the unlimited-mode backend
          // endpoint doesn't currently accept image data, only text. This keeps
          // the frontend pattern consistent, but won't reprocess the actual
          // screenshot until that endpoint supports images.
          onRequestUnlimited(PROMPT_TEXT, imageFile.name, parseAndSetAudit);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong scanning the interface. Please try again.");
          return;
        }

        parseAndSetAudit(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong scanning the interface. Please try again.");
      } finally {
        setIsScanning(false);
      }
    });
  };

  const clearAll = () => {
    setImageFile(null);
    setImagePreviewUrl("");
    resetOutput();
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
            <h2 className="tool-header-title">UI Accessibility & Contrast Visual Audit</h2>
            <p className="tool-header-seo">
              Upload a screenshot of your interface for an advisory scan of potential readability and accessibility issues.
            </p>
            <p className="a11y-disclaimer">
              This is a visual, advisory review — not a certified WCAG compliance audit or legal guarantee. Use it as a starting point, not a substitute for a real accessibility review.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            {!imageFile ? (
              <div
                className="pdf-drop-zone"
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
                  Drag & drop a UI screenshot here, or click to browse (.png, .jpg, .webp)
                </p>
              </div>
            ) : (
              <div className="pdf-file-card">
                <span className="audio-file-name">✓ {imageFile.name}</span>
                <button className="copy-button" onClick={clearAll}>Remove</button>
              </div>
            )}

            {errorMsg && <p className="audio-file-error">{errorMsg}</p>}

            {imageFile && !audit && (
              <button
                onClick={runAudit}
                disabled={isScanning}
                className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
              >
                {remainingRuns === 0
                  ? "Limit Exhausted – Click to Unlock"
                  : isScanning
                    ? "⏳ Scanning Interface..."
                    : "Run Accessibility Scan"}
              </button>
            )}

            {audit && (
              <div className="a11y-report">
                <p className="a11y-impression">{audit.overallImpression}</p>

                {audit.issues.length > 0 ? (
                  <div className="a11y-issue-list">
                    {audit.issues.map((issue, i) => (
                      <div
                        key={i}
                        className="a11y-issue-row"
                        onMouseEnter={() => setHoveredIssue(i)}
                        onMouseLeave={() => setHoveredIssue(null)}
                      >
                        <span
                          className="a11y-issue-number"
                          style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}
                        >
                          {i + 1}
                        </span>
                        <div className="a11y-issue-content">
                          <div className="a11y-issue-header">
                            <strong>{issue.label}</strong>
                            <span className={`a11y-severity-tag a11y-severity-${issue.severity}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="a11y-issue-desc">{issue.description}</p>
                          <span className="a11y-issue-location">📍 {issue.approximateLocation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="a11y-clean-message">✓ No major issues spotted — nice work!</p>
                )}

                <button className="copy-button" onClick={clearAll} style={{ marginTop: "16px" }}>
                  Scan Another
                </button>
              </div>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>Catch accessibility issues before your users do</h2>
              <p>Upload a screenshot of any interface and get an advisory scan for common readability and accessibility pitfalls — low-contrast text, cramped tap targets, hard-to-spot buttons — with each issue pinned directly onto your screenshot.</p>
            </section>
          </>
        }
        canvas={
          imagePreviewUrl ? (
            <div className="a11y-canvas-wrapper">
              <img src={imagePreviewUrl} alt="Uploaded interface" className="a11y-canvas-img" />

              {audit?.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`a11y-marker ${hoveredIssue === i ? "a11y-marker-active" : ""}`}
                  style={{
                    left: `${issue.xPercent}%`,
                    top: `${issue.yPercent}%`,
                    borderColor: SEVERITY_COLORS[issue.severity]
                  }}
                  onMouseEnter={() => setHoveredIssue(i)}
                  onMouseLeave={() => setHoveredIssue(null)}
                >
                  <span className="a11y-marker-number" style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}>
                    {i + 1}
                  </span>
                  {hoveredIssue === i && (
                    <div className="a11y-marker-tooltip">
                      <strong>{issue.label}</strong>
                      <p>{issue.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
              Your screenshot and issue markers will appear here.
            </p>
          )
        }
      />
    </>
  );
}