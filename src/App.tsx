import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Home from "./pages/Home";
// Import our individual clean modular component files directly from our folder pool
import ChatGptCleaner from "./tools/featured/ChatGptCleaner";
import TextHumanizer from "./tools/featured/TextHumanizer";
import BulkFileRenamer from "./tools/featured/BulkFileRenamer";

import PirateTranslator from "./tools/creator-tools/PirateTranslator";
import LogicMapStudio from "./tools/my-tools/LogicMapStudio";
import TranscriptCleaner from "./tools/my-tools/TranscriptCleaner";
import TrashCheatSheet from "./tools/business-tools/TrashCheatSheet";
import ThriftAppraisalGrid from "./tools/business-tools/ThriftAppraisalGrid";
import RoadsideEstimateProofer from "./tools/business-tools/RoadsideEstimateProofer";
import DotLogAuditor from "./tools/business-tools/DotLogAuditor";
import AmazonInvoiceAuditor from "./tools/business-tools/AmazonInvoiceAuditor";
// Ads temporarily disabled — imports commented out, components untouched in /ads
// import AdsterraSkyscraper from './ads/AdsterraSkyscraper';
// import AdsterraNativeBanner from './ads/AdsterraNativeBanner';
import { getDeviceId } from './utils/deviceId';
import { useRankedTools } from './hooks/useRankedTools';


interface UserAccount {
  username: string;
  isPremium: boolean;
  walletBalance: number;
}

interface CustomTool {
  id: string;
  title: string;
  desc: string;
  promptInstructions: string;
  creator: string;
  usesCount: number;
}

function AdLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
<div className="viewport-frame">
<div className="scroll-center">
        <div className="scroll-center-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

function ProcessingOverlay({ message, onComplete }: { message: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => { onComplete(); }, 3000);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="overlay-bg">
      <div className="overlay-card">
        <div className="spinner-ring"></div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Processing Stream Matrix...</h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{message}</p>
      </div>
    </div>
  );
}

export default function App() {
  const { rankedTools } = useRankedTools();
  const myToolsList = rankedTools.slice(5);

  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('lazysuite_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [customTools, setCustomTools] = useState<CustomTool[]>([]);
  const [remainingRuns, setRemainingRuns] = useState<number>(5);
  const [adUnlocksUsed, setAdUnlocksUsed] = useState<number>(0);
  const [unlockOverlayOpen, setUnlockOverlayOpen] = useState(false);
const [unlockSecondsLeft, setUnlockSecondsLeft] = useState(10);
const [unlockSessionId, setUnlockSessionId] = useState<string | null>(null);

// --- NEW: Tier 3 unlimited-mode state ---
const [unlimitedModeActive, setUnlimitedModeActive] = useState(false);
const [unlimitedSecondsLeft, setUnlimitedSecondsLeft] = useState(10);
const [pendingUnlimitedPayload, setPendingUnlimitedPayload] = useState<{
  promptInstructions: string;
  userInput: string;
  onDone: (output: string) => void;
} | null>(null);
const startUnlock = async () => {
  try {
    const res = await fetch('/api/unlock-start', {
      method: 'POST',
      headers: { 'X-Device-Id': getDeviceId() }
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Could not start unlock.");
      return;
    }
    setUnlockSessionId(data.sessionId);
    setUnlockSecondsLeft(10);
    setUnlockOverlayOpen(true);
  } catch (err) {
    console.error(err);
    alert("Something went wrong starting the unlock.");
  }
};

const completeUnlock = async () => {
  try {
    const res = await fetch('/api/unlock-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() },
      body: JSON.stringify({ sessionId: unlockSessionId })
    });
    const data = await res.json();
    setUnlockOverlayOpen(false);
    if (!res.ok) {
      alert(data.message || "Unlock failed.");
      return;
    }
    setRemainingRuns(data.remaining);
    setAdUnlocksUsed(data.unlocksUsed);
  } catch (err) {
    console.error(err);
    setUnlockOverlayOpen(false);
    alert("Something went wrong completing the unlock.");
  }
};

const startUnlimitedGate = async (
  promptInstructions: string,
  userInput: string,
  onDone: (output: string) => void
) => {
  try {
    const res = await fetch('/api/unlock-start', {
      method: 'POST',
      headers: { 'X-Device-Id': getDeviceId() }
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Could not start sponsor view.");
      return;
    }
    setUnlockSessionId(data.sessionId);
    setPendingUnlimitedPayload({ promptInstructions, userInput, onDone });
    setUnlimitedSecondsLeft(10);
    setUnlimitedModeActive(true);
  } catch (err) {
    console.error(err);
    alert("Something went wrong starting the sponsor view.");
  }
};

const completeUnlimitedRun = async () => {
  if (!pendingUnlimitedPayload) return;

  try {
    const res = await fetch('/api/run-unlimited-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() },
      body: JSON.stringify({
        sessionId: unlockSessionId,
        promptInstructions: pendingUnlimitedPayload.promptInstructions,
        userInput: pendingUnlimitedPayload.userInput
      })
    });
    const data = await res.json();
    setUnlimitedModeActive(false);
    if (!res.ok) {
      alert(data.message || "Sponsor view failed. Please try again.");
      return;
    }
    pendingUnlimitedPayload.onDone(data.output);
  } catch (err) {
    console.error(err);
    setUnlimitedModeActive(false);
    alert("Something went wrong completing the run.");
  } finally {
    setPendingUnlimitedPayload(null);
  }
};

useEffect(() => {
  if (!unlimitedModeActive) return;
  if (unlimitedSecondsLeft <= 0) {
    completeUnlimitedRun();
    return;
  }
  const t = setTimeout(() => setUnlimitedSecondsLeft(s => s - 1), 1000);
  return () => clearTimeout(t);
}, [unlimitedModeActive, unlimitedSecondsLeft]);

useEffect(() => {
  if (!unlockOverlayOpen) return;
  if (unlockSecondsLeft <= 0) {
    completeUnlock();
    return;
  }
  const t = setTimeout(() => setUnlockSecondsLeft(s => s - 1), 1000);
  return () => clearTimeout(t);
}, [unlockOverlayOpen, unlockSecondsLeft]);

  const [usageCount, setUsageCount] = useState<number>(() => {
    const count = localStorage.getItem('lazysuite_daily_count');
    const timestamp = localStorage.getItem('lazysuite_reset_time');
    
    if (timestamp && Date.now() > parseInt(timestamp)) {
      localStorage.setItem('lazysuite_daily_count', '0');
      localStorage.setItem('lazysuite_reset_time', (Date.now() + 24 * 60 * 60 * 1000).toString());
      return 0;
    }
    return count ? parseInt(count) : 0;
  });

  const [resetTimeLeft, setResetTimeLeft] = useState<string>("");
  const [route, setRoute] = useState<string>('hub');
  const [returnRoute, setReturnRoute] = useState<string>('hub');
  const prevRouteRef = useRef<string>('hub');

  // Remembers which list page (Hub, Daily Tools, or Business Tools) you were
  // on right before opening a tool, so the back button returns you there
  // instead of always jumping to the Hub.
  useEffect(() => {
    const listRoutes = ['hub', 'my-tools', 'business-tools'];
    const prev = prevRouteRef.current;
    if (listRoutes.includes(prev) && !listRoutes.includes(route)) {
      setReturnRoute(prev);
    }
    prevRouteRef.current = route;
  }, [route]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [formUser, setFormUser] = useState<string>("");

  const [toolTitle, setToolTitle] = useState<string>("");
  const [toolDesc, setToolDesc] = useState<string>("");
  const [toolPrompt, setToolPrompt] = useState<string>("");

  const [activeTool] = useState<CustomTool | null>(null);
  const [toolInput, setToolInput] = useState<string>("");
  const [toolOutput, setToolOutput] = useState<string>("");

  useEffect(() => {
    if (user) {
      localStorage.setItem('lazysuite_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lazysuite_user');
    }
  }, [user]);

  useEffect(() => {
    const fetchUsageStatus = async () => {
      try {
        const res = await fetch('/api/usage-status', {
          headers: { 'X-Device-Id': getDeviceId() }
        });
        const data = await res.json();
        if (res.ok) {
          setRemainingRuns(data.remaining);
          setAdUnlocksUsed(data.unlocksUsed);
        }
      } catch (err) {
        console.error('Failed to fetch usage status:', err);
      }
    };
    fetchUsageStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('lazysuite_custom_tools', JSON.stringify(customTools));
  }, [customTools]);

  useEffect(() => {
    const timer = setInterval(() => {
      const timestamp = localStorage.getItem('lazysuite_reset_time');
      if (!timestamp) {
        localStorage.setItem('lazysuite_reset_time', (Date.now() + 24 * 60 * 60 * 1000).toString());
        return;
      }
      const diff = parseInt(timestamp) - Date.now();
      if (diff <= 0) {
        setUsageCount(0);
        localStorage.setItem('lazysuite_daily_count', '0');
        localStorage.setItem('lazysuite_reset_time', (Date.now() + 24 * 60 * 60 * 1000).toString());
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setResetTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [usageCount]);

  const triggerProcess = (message: string, action: () => void) => {
  // TEMP: Disable free limit while developing
  // if (usageCount >= 5 && (!user || !user.isPremium)) {
  //   alert("Daily Free Limit Reached!");
  //   return;
  // }

    setMsg(message);
    setPendingAction(() => {
      return () => {
        action();
        if (!user || !user.isPremium) {
          const nextCount = usageCount + 1;
          setUsageCount(nextCount);
          localStorage.setItem('lazysuite_daily_count', nextCount.toString());
        }
      };
    });
    setProcessing(true);
  };

  const handleComplete = () => {
    setProcessing(false);
    if (pendingAction) pendingAction();
  };

  const handleCreateTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolTitle || !toolPrompt || !user) return;

    const newId = toolTitle.toLowerCase().replace(/\s+/g, '-');
    const newTool: CustomTool = {
      id: newId,
      title: toolTitle,
      desc: toolDesc || "Custom user-generated automated prompt processing pipeline.",
      promptInstructions: toolPrompt,
      creator: user.username,
      usesCount: 0
    };

    setCustomTools([newTool, ...customTools]);
    setToolTitle(""); setToolDesc(""); setToolPrompt("");
    setRoute('hub');
  };

  const executeCustomTool = () => {
    if (!activeTool || !toolInput) return;
    triggerProcess(`Running creator array prompt across marketplace nodes...`, () => {
      setToolOutput(`[OUTPUT BLOCK GENERATED BY DYNAMIC SYSTEM PROMPT: "${activeTool.promptInstructions}"]\n\nProcessed Response Trace: Re-aligned your input matrix "${toolInput}" cleanly.`);
      
      setCustomTools(prev => prev.map(t => {
        if (t.id === activeTool.id) {
          const addedUses = t.usesCount + 1;
          if (user && t.creator === user.username && !user.isPremium) {
            setUser(prevUser => prevUser ? { ...prevUser, walletBalance: prevUser.walletBalance + 0.09 } : null);
          }
          return { ...t, usesCount: addedUses };
        }
        return t;
      }));
    });
  };

  return (
    <AdLayoutWrapper>
      <div className="marketplace-nav">
        <div className="nav-brand" onClick={() => setRoute('hub')}>LazySuite Builder Hub</div>
        <div className="nav-user-badge">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>User: <strong style={{ color: '#34d399' }}>{user.username}</strong> {user.isPremium && <span style={{ color: '#eab308' }}>[PRO]</span>}</span>
              <span>
                  Balance:
                  <strong style={{ color: '#2dd4bf' }}>
                    ${user?.walletBalance.toFixed(2)}
                  </strong>
                </span>

                {!user?.isPremium && (
                <button
                className="btn-premium"
                onClick={() =>
                  setUser(prev =>
                    prev
                      ? { ...prev, isPremium: true }
                      : null
                  )
                }
              >Go Pro (0% Fees)</button>
              )}
              <button className="btn-logout" onClick={() => { setUser(null); setRoute('hub'); }}>Logout</button>
            </div>
          ) : null}
        </div>
      </div>

      {false && (
        <div className={usageCount >= 4 ? "limit-warning-banner-danger" : "limit-warning-banner-safe"}>
          {usageCount >= 4 ? "🔒" : "✅"} Platform Account Usage Cap: <strong>{usageCount}/5 Free Runs Used Today</strong>. Resetting in: <strong>{resetTimeLeft || "calculating..."}</strong>
        </div>
      )}

{adUnlocksUsed > 0 && (
  <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
    Ad unlocks used today: {adUnlocksUsed}/1
  </p>
)}

      {authMode && (
        <div className="auth-card">
          <h3 style={{ margin: '0 0 12px 0', textAlign: 'center' }}>{authMode === 'login' ? 'Welcome Back' : 'Create Builder Account'}</h3>
          <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', margin: '0 0 16px 0' }}>Join the automated 10% commission pool.</p>
          <input type="text" placeholder="Enter Username..." value={formUser} onChange={(e) => setFormUser(e.target.value)} className="form-input" />
          <button className="btn-generate" style={{ marginTop: '4px' }} onClick={() => {
            if (!formUser) return;
            setUser({ username: formUser, isPremium: false, walletBalance: 0.00 });
            setFormUser(""); setAuthMode(null);
          }}>
            {authMode === 'login' ? 'Sign In Securely' : 'Register Free Day-Pass'}
          </button>
          <button style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', width: '100%', marginTop: '12px', cursor: 'pointer' }} onClick={() => setAuthMode(null)}>Cancel</button>
        </div>
      )}

{route !== 'hub' && !authMode && (
        <button
          onClick={() => setRoute(route === 'my-tools' || route === 'business-tools' ? 'hub' : returnRoute)}
          className="btn-back"
        >
          &larr; Return To {route === 'my-tools' || route === 'business-tools'
            ? 'Boutique Mall Lobby'
            : returnRoute === 'my-tools'
              ? 'Daily Tools'
              : returnRoute === 'business-tools'
                ? 'Business Tools'
                : 'Boutique Mall Lobby'}
        </button>
      )}

      {!authMode && route === 'hub' && (
        <div>
          {user && (
            <div className="dashboard-banner">
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', color: '#eab308' }}>Creator Monetization Mode Enabled</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>{!user.isPremium ? 'You are earning 90% revenue from runs. 10% system fee applied.' : 'PRO Member tier active: Keeping 100% of custom run monetization tokens!'}</p>
              </div>
              <button onClick={() => setRoute('create-tool')} style={{ background: '#020617', border: '1px solid #eab308', color: '#eab308', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>+ Build Custom Tool</button>
            </div>
          )}

    <Home
      setRoute={setRoute}
    />

          {/*
          <div className="grid-container">
            {customTools.map(t => (
              <div key={t.id} onClick={() => { setActiveTool(t); setToolInput(""); setToolOutput(""); setRoute('run-custom'); }} className="tool-card">
                <span className="tool-badge-creator">By @{t.creator} ({t.usesCount} runs)</span>
                <h3 className="tool-card-title" style={{ paddingRight: '120px' }}>{t.title}</h3>
                <p className="tool-card-desc">{t.desc}</p>
              </div>
            ))}
          </div>
          */}
        </div>
      )}
{route === "my-tools" && (
  <div>

    <h2 className="tool-header-title">
      Daily Tools
    </h2>

    <p className="tool-header-seo">
      More tools — ranked by usage, plus what's coming next.
    </p>

    <div
      className="grid-container"
      style={{ marginTop: "24px" }}
    >

      {myToolsList.map((tool) => (
        <div
          key={tool.id}
          onClick={() => tool.isLive && setRoute(tool.id)}
          className="tool-card"
          style={!tool.isLive ? { opacity: 0.45, cursor: "default" } : undefined}
        >
          <span className="tool-badge-creator">
            {tool.creator}
          </span>

          <h3 className="tool-card-title">
            {tool.title}
          </h3>

          <p className="tool-card-desc">
            {tool.isLive ? tool.desc : "Coming Soon"}
          </p>
        </div>
      ))}

    </div>

  </div>
)}

{route === "business-tools" && (
  <div>

    <h2 className="tool-header-title">
      Business Tools
    </h2>

    <p className="tool-header-seo">
      Niche tools built for real small-business workflows — trades, resale, hospitality, and more.
    </p>

    <div
      className="grid-container"
      style={{ marginTop: "24px" }}
    >

<div onClick={() => setRoute("trashcheatsheet")} className="tool-card">
        <span className="tool-badge-creator">Admin</span>
        <h3 className="tool-card-title">Guest Trash & Checkout Cheat Sheet</h3>
        <p className="tool-card-desc">Turn a city trash calendar screenshot into a guest-friendly pickup card.</p>
        <p className="tool-card-category">Business Tool</p>
      </div>

      <div onClick={() => setRoute("thriftappraisal")} className="tool-card">
        <span className="tool-badge-creator">Admin</span>
        <h3 className="tool-card-title">Visual Thrift Appraisal Grid</h3>
        <p className="tool-card-desc">Get an estimated resale value and eBay listing draft from a photo.</p>
        <p className="tool-card-category">Business Tool</p>
      </div>

      <div onClick={() => setRoute("roadsideestimate")} className="tool-card">
        <span className="tool-badge-creator">Admin</span>
        <h3 className="tool-card-title">Roadside Estimate Proofer</h3>
        <p className="tool-card-desc">Turn a photo and rough notes into a professional repair estimate.</p>
        <p className="tool-card-category">Business Tool</p>
      </div>

      <div onClick={() => setRoute("dotlogauditor")} className="tool-card">
        <span className="tool-badge-creator">Admin</span>
        <h3 className="tool-card-title">DOT Log Quick-Check</h3>
        <p className="tool-card-desc">A quick first-pass review of your driving log before you submit it.</p>
        <p className="tool-card-category">Business Tool</p>
      </div>

      <div onClick={() => setRoute("amazoninvoiceauditor")} className="tool-card">
        <span className="tool-badge-creator">Admin</span>
        <h3 className="tool-card-title">Supplier Invoice Field Checker</h3>
        <p className="tool-card-desc">Check your supplier invoice against standard commercial invoice fields.</p>
        <p className="tool-card-category">Business Tool</p>
      </div>

    </div>

  </div>
)}
      {route === 'cleaner' && <ChatGptCleaner triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />}
      {route === 'humanizer' && <TextHumanizer triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />}
      {route === 'renamer' && <BulkFileRenamer triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />}
      {route === 'pirate' && (
        <PirateTranslator triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'logicmap' && (
        <LogicMapStudio triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'transcript' && (
        <TranscriptCleaner triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'trashcheatsheet' && (
        <TrashCheatSheet triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'thriftappraisal' && (
        <ThriftAppraisalGrid triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'roadsideestimate' && (
        <RoadsideEstimateProofer triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'dotlogauditor' && (
        <DotLogAuditor triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'amazoninvoiceauditor' && (
        <AmazonInvoiceAuditor triggerProcess={triggerProcess} remainingRuns={remainingRuns} onUpdateRemaining={setRemainingRuns} onRequestUnlock={startUnlock} onRequestUnlimited={startUnlimitedGate} />
      )}
      {route === 'create-tool' && (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>Build Your Own Custom Tool</h2>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 20px 0', fontFamily: 'monospace' }}>Every execution logs interstitial ad revenue commissions directly into your wallet.</p>
          <form onSubmit={handleCreateTool} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '4px' }}>TOOL TITLE</label>
              <input type="text" placeholder="e.g., Code Comment Eraser, Blog Outline Builder..." value={toolTitle} onChange={(e) => setToolTitle(e.target.value)} className="form-input" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '4px' }}>SHORT PUBLIC DESCRIPTION</label>
              <input type="text" placeholder="Explain what painful data-friction point this solves..." value={toolDesc} onChange={(e) => setToolDesc(e.target.value)} className="form-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '4px' }}>SECRET SYSTEM CORE PROMPT INSTRUCTIONS</label>
              <textarea placeholder="e.g., Act as a master copywriter. Take the input text and restructure it into an attention-grabbing sales letter hook..." value={toolPrompt} onChange={(e) => setToolPrompt(e.target.value)} className="textarea-input" style={{ height: '80px' }} required />
            </div>
            <button type="submit" className="btn-generate">Deploy Custom Tool to Marketplace Hub</button>
          </form>
        </div>
      )}

{route === 'run-custom' && activeTool && (
  <div>
    <h2 className="tool-header-title">
      {activeTool.title}
    </h2>

    <p className="tool-header-seo">
      Community Tool • Created by <strong>@{activeTool.creator}</strong>
    </p>

    <p
      style={{
        fontSize: "12px",
        color: "#94a3b8",
        marginTop: "12px",
        marginBottom: "20px",
      }}
    >
      {activeTool.desc}
    </p>

    <textarea
      value={toolInput}
      onChange={(e) => setToolInput(e.target.value)}
      placeholder="Enter your text..."
      className="textarea-input"
    />

    <button
      onClick={executeCustomTool}
      disabled={!toolInput.trim()}
      className="btn-generate"
    >
      Translate
    </button>

    {toolOutput && (
  <div className="output-box">
    {toolOutput}
  </div>
)}
  </div>
)}
  {unlockOverlayOpen && (
  <div className="overlay-bg">
    <div className="overlay-card">
    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Unlocking 3 more runs...</h3>
      <p style={{ margin: '16px 0 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
        {unlockSecondsLeft > 0 ? `Unlocking in ${unlockSecondsLeft}s...` : "Unlocking..."}
      </p>
    </div>
  </div>
)}

{unlimitedModeActive && (
  <div className="overlay-bg">
    <div className="overlay-card">
    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Processing your request...</h3>
      <p style={{ margin: '16px 0 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
        {unlimitedSecondsLeft > 0 ? `Unlocking in ${unlimitedSecondsLeft}s...` : "Processing..."}
      </p>
    </div>
  </div>
)}
  {processing && <ProcessingOverlay message={msg} onComplete={handleComplete} />}
</AdLayoutWrapper>
  );
}