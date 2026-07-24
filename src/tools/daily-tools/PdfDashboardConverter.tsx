import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";
import "../../styles/PdfDashboardConverter.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Load the pdf.js worker from a CDN matching the installed version — avoids bundler config changes
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const seo = TOOL_METADATA.pdfdashboard;

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
  remainingRuns: number;
  onUpdateRemaining: (n: number) => void;
  onRequestUnlock: () => void;
  onRequestUnlimited: (promptInstructions: string, userInput: string, onDone: (output: string) => void) => void;
}

interface MetricCard {
  label: string;
  value: string;
}

interface ChartBlock {
  type: "bar" | "pie";
  title: string;
  labels: string[];
  values: number[];
}

interface DashboardData {
  title: string;
  summary: string;
  metrics: MetricCard[];
  charts: ChartBlock[];
}

const MAX_CHARS = 40000; // keeps the extracted text within a reasonable prompt size

const CHART_COLORS = [
  "#2dd4bf", "#facc15", "#f87171", "#818cf8", "#34d399", "#fb923c", "#a78bfa", "#60a5fa"
];

const PROMPT_TEXT = `
You are a data analyst assistant that converts raw extracted PDF text (financial statements, data sheets, analytics reports) into a structured dashboard.

Read the text below and identify real numeric data — totals, percentages, categories, comparisons, trends.

Return ONLY valid JSON matching this EXACT shape, nothing else, no markdown fences, no explanation:

{
  "title": "Short dashboard title based on the document",
  "summary": "2-3 sentence plain-language summary of what this document shows",
  "metrics": [
    { "label": "Short metric name", "value": "The value, formatted (e.g. $1.2M, 34%, 512 units)" }
  ],
  "charts": [
    {
      "type": "bar",
      "title": "Chart title",
      "labels": ["Category A", "Category B"],
      "values": [123, 456]
    }
  ]
}

Rules:
- Include 3-6 items in "metrics" — the most important headline numbers.
- Include 1-3 items in "charts" — use "type": "bar" for comparisons over categories, "type": "pie" for proportions/breakdowns of a whole.
- Only use real numbers found in the text. Do not invent data.
- If the document has no clear numeric data, still return the JSON shape, with metrics/charts as empty arrays and explain why in "summary".
- "labels" and "values" arrays must be the same length.
- Output ONLY the raw JSON object, nothing else.
`;

export default function PdfDashboardConverter({
  triggerProcess,
  remainingRuns,
  onUpdateRemaining,
  onRequestUnlock,
  onRequestUnlimited
}: ToolProps) {
  const [fileName, setFileName] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetOutput = () => {
    setDashboard(null);
    setErrorMsg("");
  };

  const extractPdfText = async (file: File) => {
    setIsExtracting(true);
    resetOutput();
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;

        if (fullText.length > MAX_CHARS) {
          fullText = fullText.slice(0, MAX_CHARS) + "\n[Remaining pages truncated to stay within processing limits]";
          break;
        }
      }

      if (!fullText.trim()) {
        setErrorMsg("No readable text was found in that PDF — it may be a scanned image rather than real text.");
        setIsExtracting(false);
        return;
      }

      setExtractedText(fullText.trim());
    } catch (err) {
      console.error("PDF extraction failed:", err);
      setErrorMsg("Couldn't read that PDF. Please make sure it's a valid, non-password-protected file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      extractPdfText(file);
    } else if (file) {
      setErrorMsg("Please upload a .pdf file.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      extractPdfText(file);
    } else if (file) {
      setErrorMsg("Please upload a .pdf file.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const parseAndSetDashboard = (rawOutput: string) => {
    const cleaned = rawOutput
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed: DashboardData = JSON.parse(cleaned);
      setDashboard(parsed);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr, cleaned);
      setErrorMsg("The AI's response wasn't in the expected format. Please try again.");
    }
  };

  const generateDashboard = async () => {
    if (!extractedText) return;

    if (remainingRuns === 0) {
      onRequestUnlock();
      return;
    }

    resetOutput();

    triggerProcess("Reading your data and building a dashboard...", async () => {
      setIsGenerating(true);

      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT_TEXT, userInput: extractedText, toolId: "pdfdashboard" })
        });

        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) {
          onUpdateRemaining(Number(limitRemaining));
        }

        if (response.status === 202) {
          onRequestUnlimited(PROMPT_TEXT, extractedText, parseAndSetDashboard);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setErrorMsg(data.message || "Something went wrong building the dashboard. Please try again.");
          return;
        }

        parseAndSetDashboard(data.output);
      } catch (error) {
        console.error("Request failed:", error);
        setErrorMsg("Something went wrong building the dashboard. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const clearAll = () => {
    setFileName("");
    setExtractedText("");
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
            <h2 className="tool-header-title">PDF-to-Dashboard Converter</h2>
            <p className="tool-header-seo">
              Upload a financial statement, data sheet, or analytics report — get an instant visual dashboard.
            </p>

            <RunsBadge remainingRuns={remainingRuns} />

            {!fileName ? (
              <div
                className="pdf-drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInputChange}
                  className="repo-file-input-hidden"
                />
                <p className="repo-drop-text">
                  {isExtracting ? "Reading PDF contents..." : "Drag & drop a PDF here, or click to browse"}
                </p>
              </div>
            ) : (
              <div className="pdf-file-card">
                <span className="audio-file-name">✓ {fileName}</span>
                <button className="copy-button" onClick={clearAll}>Remove</button>
              </div>
            )}

            {errorMsg && <p className="audio-file-error">{errorMsg}</p>}

            {extractedText && !dashboard && (
              <button
                onClick={generateDashboard}
                disabled={isGenerating}
                className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}
              >
                {remainingRuns === 0
                  ? "Limit Exhausted – Click to Unlock"
                  : isGenerating
                    ? "⏳ Building Dashboard..."
                    : "Generate Dashboard"}
              </button>
            )}

            {dashboard && (
              <button className="copy-button" onClick={clearAll} style={{ marginTop: "16px" }}>
                Start Over
              </button>
            )}

            <AdsterraNativeBanner />

            <section className="tool-seo-section">
              <h2>Turn a PDF report into an instant visual dashboard</h2>
              <p>Financial statements, data sheets, and analytics reports are hard to skim in raw PDF form. This tool reads the real numbers straight out of your document and turns them into headline metrics and charts you can actually glance at.</p>
            </section>
          </>
        }
        canvas={
          dashboard ? (
            <div className="pdf-dashboard">
              <h3 className="pdf-dashboard-title">{dashboard.title}</h3>
              <p className="pdf-dashboard-summary">{dashboard.summary}</p>

              {dashboard.metrics.length > 0 && (
                <div className="pdf-metrics-grid">
                  {dashboard.metrics.map((m, i) => (
                    <div key={i} className="pdf-metric-card">
                      <span className="pdf-metric-value">{m.value}</span>
                      <span className="pdf-metric-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {dashboard.charts.length > 0 && (
                <div className="pdf-charts-grid">
                  {dashboard.charts.map((chart, i) => (
                    <div key={i} className="pdf-chart-card">
                      <h4 className="pdf-chart-title">{chart.title}</h4>
                      {chart.type === "bar" ? (
                        <Bar
                          data={{
                            labels: chart.labels,
                            datasets: [{
                              data: chart.values,
                              backgroundColor: CHART_COLORS
                            }]
                          }}
                          options={{
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
                              y: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } }
                            }
                          }}
                        />
                      ) : (
                        <Pie
                          data={{
                            labels: chart.labels,
                            datasets: [{
                              data: chart.values,
                              backgroundColor: CHART_COLORS
                            }]
                          }}
                          options={{
                            responsive: true,
                            plugins: { legend: { position: "bottom", labels: { color: "#94a3b8" } } }
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
              Your dashboard will appear here once generated.
            </p>
          )
        }
      />
    </>
  );
}