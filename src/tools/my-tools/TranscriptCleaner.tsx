import { useState, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import "../../styles/TranscriptCleaner.css";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

const TOOL_METADATA = {
  title: "Free Transcript Cleaner & Meeting Summarizer",
  description:
    "Clean messy meeting transcripts from Zoom, Teams, or Google Meet — from text or raw audio. Remove timestamps and generate organized summaries with action items.",
  canonicalUrl:
    "https://lazysuite-mini-mall.vercel.app/transcript-cleaner",
};

const SUMMARY_INSTRUCTIONS = `
You are an AI meeting assistant that specializes in cleaning and organizing raw meeting transcripts or audio recordings.

Your tasks are:

- If given audio, listen to it directly and transcribe the spoken content.
- Remove all timestamps.
- Identify and label different speakers where it's clear from context (e.g. "Speaker 1", or by name if stated).
- Correct broken or fragmented sentences.
- Preserve the original meaning without inventing information.
- Remove filler words, repeated phrases, and transcription noise.
- Organize the information into a clean, professional meeting summary.

Always return the response using EXACTLY this plain-text format:

Meeting Summary

Overview
Write 2–4 sentences summarizing the meeting.

Key Discussion
- Important discussion point
- Important discussion point
- Important discussion point

Decisions
- Decision made
- Decision made

Action Items
- Person or Team — Task to complete
- Person or Team — Task to complete

Do NOT use Markdown.

Do NOT use:
# ## ###
**
__
---
\`\`\`

Return plain text only with clean spacing and readable formatting.
`;

const MAX_AUDIO_MB = 3;

export default function TranscriptCleaner({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [activeTab, setActiveTab] = useState<"text" | "audio">("text");
  const [input, setInput] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string>("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAudioError("");

    if (!file) {
      setAudioFile(null);
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_AUDIO_MB) {
      setAudioError(
        `That file is ${sizeMB.toFixed(1)}MB. Please keep audio uploads under ${MAX_AUDIO_MB}MB (roughly 2–3 minutes of recording) so it can be processed.`
      );
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAudioFile(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result looks like "data:audio/mpeg;base64,AAAA..." — we only want the part after the comma
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (activeTab === "text" && !input.trim()) return;
    if (activeTab === "audio" && !audioFile) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    triggerProcess(
      activeTab === "audio"
        ? "Listening to your audio and extracting the meeting summary..."
        : "Sorting timestamp timelines and distilling chat blocks...",
      async () => {
        setIsLoading(true);

        try {
          let response: Response;

          if (activeTab === "audio" && audioFile) {
            const audioBase64 = await fileToBase64(audioFile);

            response = await fetch("/api/run-tool-audio", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
              body: JSON.stringify({
                promptInstructions: SUMMARY_INSTRUCTIONS,
                audioBase64,
                mimeType: audioFile.type || "audio/mpeg"
              })
            });
          } else {
            response = await fetch("/api/run-tool", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
              body: JSON.stringify({
                promptInstructions: SUMMARY_INSTRUCTIONS,
                userInput: input,
                toolId: "transcript"
              })
            });
          }

          const limitRemaining = response.headers.get("X-RateLimit-Remaining");
          if (limitRemaining !== null) {
            onUpdateRemaining(Number(limitRemaining));
          }

          if (response.status === 202) {
            if (activeTab === "text") {
              onRequestUnlimited(SUMMARY_INSTRUCTIONS, input, (output) => setOutput(output));
            } else {
              alert("You've reached your daily limit for audio processing. Please try the text tab, or come back tomorrow.");
            }
            return;
          }

          const data = await response.json();

          if (!response.ok) {
            alert(data.message || "Something went wrong.");
            return;
          }

          setOutput(data.output);
        } catch (error) {
          console.error(error);
          setOutput("Something went wrong generating a response.");
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canSubmit =
    (activeTab === "text" && input.trim().length > 0) ||
    (activeTab === "audio" && !!audioFile);

  return (
    <>
      <Helmet>
        <title>{TOOL_METADATA.title}</title>
        <meta name="description" content={TOOL_METADATA.description} />
        <link rel="canonical" href={TOOL_METADATA.canonicalUrl} />
        <meta property="og:title" content={TOOL_METADATA.title} />
        <meta property="og:description" content={TOOL_METADATA.description} />
      </Helmet>

      <ToolLayout
        controls={
          <>
            <h2 className="tool-header-title">Intelligent Transcript Structurer</h2>

            <p className="tool-header-description">
              Clean messy meeting transcripts — from pasted text or a raw audio recording — into organized summaries and actionable notes.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            <div className="tab-toggle-bar" style={{ marginTop: "12px" }}>
              <button
                className={activeTab === "text" ? "tab-button tab-button-active" : "tab-button"}
                onClick={() => setActiveTab("text")}
              >
                Paste Text Transcript
              </button>
              <button
                className={activeTab === "audio" ? "tab-button tab-button-active" : "tab-button"}
                onClick={() => setActiveTab("audio")}
              >
                Upload Raw Audio Recording File
              </button>
            </div>

            {activeTab === "text" ? (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a Zoom, Teams, Google Meet, or interview transcript here..."
                className="textarea-input"
                style={{ marginTop: "12px" }}
              />
            ) : (
              <div className="audio-upload-zone">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="audio-file-input"
                />
                {audioFile && (
                  <p className="audio-file-name">
                    ✓ Selected: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(1)}MB)
                  </p>
                )}
                {audioError && <p className="audio-file-error">{audioError}</p>}
                <p className="audio-file-hint">
                  Accepts .mp3, .wav, .m4a — keep it under {MAX_AUDIO_MB}MB (roughly 2–3 minutes) for reliable processing.
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!canSubmit || isLoading}
              className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
            >
              {remainingRuns === 0
                ? "Limit Exhausted – Click to Unlock"
                : isLoading
                  ? "⏳ Processing..."
                  : "Extract Core Meeting Actions"}
            </button>
          </>
        }
        canvas={
          output ? (
            <div className="output-box">
              <div className="output-header">
                <span>Meeting Summary</span>
                <button onClick={handleCopy} className="copy-button" title="Copy">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                {output}
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
              Your meeting summary will appear here once generated.
            </p>
          )
        }
      />
    </>
  );
}