import { useState, useRef } from "react";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface LogFlag {
  issue: string;
  severity: "possible-violation" | "worth-checking";
  detail: string;
}

interface AuditResult {
  summary: string;
  flags: LogFlag[];
}

export default function DotLogAuditor({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setResult(null);
      setErrorMsg("");
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const promptText = `
You are a truck driver's assistant that reviews a photo of a driving log (paper or electronic) and does a rough, first-pass check for possible Hours of Service issues, based only on what's visible.

Return ONLY valid JSON matching this exact shape, no markdown fences, no explanation:

{
  "summary": "2-3 sentence plain-language summary of what you observed",
  "flags": [
    {
      "issue": "Short label of the potential issue",
      "severity": "possible-violation" | "worth-checking",
      "detail": "Explain what you saw and why it might matter, referencing the general 11-hour driving / 14-hour on-duty / 10-hour rest concepts where relevant"
    }
  ]
}

Rules:
- This is an informal, visual first-pass check — NOT an official DOT/FMCSA compliance determination. Do not claim certainty.
- If the log looks unclear or hard to read, say so honestly rather than guessing at numbers.
- If nothing looks obviously wrong, return an empty flags array and say so in summary.
- Output ONLY the raw JSON object.
`;

  const handleAiOutput = (rawOutput: string) => {
    const cleaned = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      setResult(JSON.parse(cleaned));
    } catch (err) {
      console.error("JSON parse failed:", err, cleaned);
      setErrorMsg("The AI's response wasn't in the expected format. Please try again.");
    }
  };

  const runAudit = async () => {
    if (!imageFile) return;
    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    setErrorMsg("");
    setResult(null);

    triggerProcess("Reviewing your driving log for possible issues...", async () => {
      setIsLoading(true);
      try {
        const imageBase64 = await fileToBase64(imageFile);

        const response = await fetch("/api/run-tool-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({
            promptInstructions: promptText,
            imageBase64,
            mimeType: imageFile.type,
            toolId: "dotlogauditor"
          })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));

        if (response.status === 202) {
          onRequestUnlimited(promptText, "[log photo uploaded]", handleAiOutput);
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong. Please try again.");
          return;
        }

        handleAiOutput(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <ToolLayout
      controls={
        <>
          <h2 className="tool-header-title">DOT Log Quick-Check</h2>
          <p className="tool-header-seo">
            Snap a photo of your driving log for a quick first-pass check before you submit it.
          </p>
          <p className="a11y-disclaimer">
            ⚠️ This is an informal, visual first-pass check only — it is NOT an official DOT/FMCSA compliance review and carries no legal guarantee. Always verify your actual hours against official Hours of Service regulations before submitting any log.
          </p>

          <RunsBadge remainingRuns={remainingRuns} />

          <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleInputChange} className="repo-file-input-hidden" />
          <div className="pdf-drop-zone" onClick={() => fileInputRef.current?.click()}>
            <p className="repo-drop-text">{imageFile ? `✓ ${imageFile.name}` : "Click to upload a photo of your driving log"}</p>
          </div>

          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}

          <button
            onClick={runAudit}
            disabled={!imageFile || isLoading}
            className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
          >
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Reviewing Log..." : "Run Quick-Check"}
          </button>

          <AdsterraNativeBanner />

          <section className="tool-seo-section">
            <h2>Catch obvious log mistakes before you submit</h2>
            <p>Minor formatting or math errors on a driving log can lead to costly fines. This tool gives independent drivers a quick, informal second look at their log photo to catch obvious red flags — a helpful sanity check, not a substitute for knowing the official Hours of Service rules.</p>
          </section>
        </>
      }
      canvas={
        result ? (
          <div className="output-box">
            <p style={{ marginBottom: "12px" }}>{result.summary}</p>
            {result.flags.length > 0 ? (
              result.flags.map((flag, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "12px" }}>{flag.issue}</strong>
                    <span style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: flag.severity === "possible-violation" ? "rgba(248,113,113,0.15)" : "rgba(251,191,36,0.15)",
                      color: flag.severity === "possible-violation" ? "#f87171" : "#fbbf24"
                    }}>
                      {flag.severity === "possible-violation" ? "Check This" : "Worth Reviewing"}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>{flag.detail}</p>
                </div>
              ))
            ) : (
              <p style={{ color: "#34d399", fontWeight: "bold", fontSize: "13px" }}>✓ No obvious issues spotted in this quick-check.</p>
            )}
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
            Your log review will appear here.
          </p>
        )
      }
    />
  );
}