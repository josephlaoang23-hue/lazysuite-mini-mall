import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { TOOL_METADATA } from "../../seo/toolMetadata";
import RunsBadge from "../../components/RunsBadge";
import ToolLayout from "../../components/ToolLayout";
import { getDeviceId } from "../../utils/deviceId";
import AdsterraNativeBanner from "../../ads/AdsterraNativeBanner";

const seo = TOOL_METADATA.chargebackwriter;
interface ToolProps { triggerProcess: (msg: string, action: () => void) => void; remainingRuns: number; onUpdateRemaining: (n: number) => void; onRequestUnlock: () => void; onRequestUnlimited: (p: string, u: string, d: (o: string) => void) => void; }

const PROMPT = `You are a merchant chargeback dispute assistant. Organize the dispute notice and evidence (invoices, shipping/delivery info, customer messages, receipts — pasted as text) into a professional response for a payment processor (Stripe/PayPal/Square).
Return Markdown with:
### Timeline of Events
Chronological bullet list.
### Supporting Evidence Summary
Bullet summary of each piece of evidence.
### Dispute Response Letter
A polished, professional draft letter. Do not make legal claims or guarantee outcomes — present facts only.`;

export default function ChargebackWriter({ triggerProcess, remainingRuns, onUpdateRemaining, onRequestUnlock, onRequestUnlimited }: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (remainingRuns === 0) { onRequestUnlock(); return; }
    setErrorMsg(""); setOutput("");
    triggerProcess("Building your dispute response...", async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          body: JSON.stringify({ promptInstructions: PROMPT, userInput: input, toolId: "chargebackwriter" })
        });
        const limitRemaining = response.headers.get("X-RateLimit-Remaining");
        if (limitRemaining !== null) onUpdateRemaining(Number(limitRemaining));
        if (response.status === 202) { onRequestUnlimited(PROMPT, input, setOutput); return; }
        const data = await response.json();
        if (!response.ok) { setErrorMsg(data.message || "Something went wrong."); return; }
        setOutput(data.output);
      } catch (e) { console.error(e); setErrorMsg("Something went wrong."); }
      finally { setIsLoading(false); }
    });
  };

  const copyOutput = async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <>
      <Helmet><title>{seo.title}</title><meta name="description" content={seo.description} /><link rel="canonical" href={seo.canonical} /></Helmet>
      <ToolLayout
        controls={<>
          <h2 className="tool-header-title">Chargeback Dispute Evidence Writer</h2>
          <p className="tool-header-seo">Paste your dispute notice and evidence — get a professional response draft.</p>
          <RunsBadge remainingRuns={remainingRuns} />
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste the dispute notice, invoices, shipping confirmations, customer messages, receipts..." className="textarea-input" style={{ marginTop: "12px", height: "220px" }} />
          {errorMsg && <p className="audio-file-error">{errorMsg}</p>}
          <button onClick={handleGenerate} disabled={!input.trim() || isLoading} className={remainingRuns === 0 ? "btn-generate-locked" : "btn-generate"}>
            {remainingRuns === 0 ? "Limit Exhausted – Click to Unlock" : isLoading ? "⏳ Drafting..." : "Generate Dispute Response"}
          </button>
          <AdsterraNativeBanner />
        </>}
        canvas={output ? (
          <div className="output-box" style={{ position: "relative", whiteSpace: "pre-wrap" }}>
            <button className="copy-button" onClick={copyOutput} style={{ position: "absolute", top: "12px", right: "12px" }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            {output}
          </div>
        ) : <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Your dispute response will appear here.</p>}
      />
    </>
  );
}