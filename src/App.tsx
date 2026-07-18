import React, { useState, useEffect } from 'react';
import './App.css';
import Home from "./pages/Home";
// Import our individual clean modular component files directly from our folder pool
import ChatGptCleaner from "./tools/featured/ChatGptCleaner";
import TextHumanizer from "./tools/featured/TextHumanizer";
import BulkFileRenamer from "./tools/featured/BulkFileRenamer";

import PirateTranslator from "./tools/creator-tools/PirateTranslator";
import AdsterraSkyscraper from './ads/AdsterraSkyscraper';
import { injectSocialBar } from './ads/adManager';
import { triggerPopunderAd } from './ads/adManager';
// Symmetrical Ad Layout, Marketplace Theme, and Interstitial Style Architecture
const STYLES_INJECTION = `
  body { margin: 0; background-color: #020617; color: #f8fafc; font-family: sans-serif; }
  .app-container { min-height: 100vh; background-color: #020617; color: #f8fafc; flex-direction: column; display: flex; }
  .ad-banner-top { width: 100%; background-color: #020617; padding: 0px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 20px; position: relative; box-sizing: border-box; }
  .ad-banner-bottom { width: 100%; background-color: #020617; padding: 0px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 20px; position: sticky; bottom: 0; z-index: 40; box-sizing: border-box; }
  .ad-label { display: none; }
  .ad-placeholder-leaderboard { width: 100%; max-width: 728px; height: 0px; display: none; }
  .ad-placeholder-footer { width: 100%; max-width: 728px; height: 0px; display: none; }
  .main-layout { display: flex; flex: 1 1 0%; width: 100%; max-width: 1920px; margin-left: auto; margin-right: auto; position: relative; justify-content: center; box-sizing: border-box; }
  .ad-skyscraper { width: 0px; display: none; }
  .ad-skyscraper-right { display: none; }
  .ad-placeholder-sky { display: none; }
  .view-lock { display: none; }
  .main-content { flex: 1 1 0%; padding-left: 16px; padding-right: 16px; padding-top: 32px; padding-bottom: 32px; max-width: 44rem; margin-left: auto; margin-right: auto; width: 100%; display: flex; flex-direction: column; justify-content: flex-start; min-height: 100vh; box-sizing: border-box; }
  
  .marketplace-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 12px; }
  .nav-brand { font-size: 20px; font-weight: 900; background: linear-gradient(to right, #2dd4bf, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer; }
  .nav-user-badge { display: flex; align-items: center; gap: 12px; font-size: 12px; font-family: monospace; }
  .btn-premium { padding: 4px 8px; background-color: #eab308; color: #020617; font-weight: bold; border-radius: 4px; border: none; cursor: pointer; }
  .btn-logout { background: none; border: none; color: #f87171; cursor: pointer; text-decoration: underline; font-family: monospace; }
  
  .lobby-header { text-align: center; max-width: 28rem; margin-left: auto; margin-right: auto; margin-bottom: 24px; }
  .lobby-title { font-size: 32px; font-weight: 900; background: linear-gradient(to right, #2dd4bf, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 8px 0; }
  .lobby-desc { font-size: 12px; color: #94a3b8; margin: 0; }
  
  .auth-card { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; max-width: 24rem; margin: 40px auto; width: 100%; box-sizing: border-box; }
  .form-input { width: 100%; padding: 10px; background-color: #020617; border: 1px solid #1e293b; border-radius: 6px; color: white; margin-bottom: 12px; font-size: 12px; box-sizing: border-box; }
  
  .grid-container { display: flex; flex-direction: column; gap: 16px; }
  .section-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; font-family: monospace; margin: 16px 0 8px 0; }
  .tool-card {
    background-color: rgba(15, 23, 42, 0.6);
    border: 1px solid #1e293b;
    padding: 20px;
    border-radius: 12px;
    cursor: pointer;
    position: relative;
    transform: translateY(0) scale(1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                background-color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .tool-card:hover {
    transform: translateY(-6px) scale(1.04);
    background-color: rgba(30, 41, 59, 0.55);
    border-color: rgba(45, 212, 191, 0.6);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(45, 212, 191, 0.15), 0 0 24px rgba(45, 212, 191, 0.18);
  }
  .tool-card-title {
    font-size: 14px;
    font-weight: bold;
    color: #cbd5e1;
    margin: 0 0 4px 0;
    transition: color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .tool-card:hover .tool-card-title {
    color: #f8fafc;
  }
  .tool-card-desc {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    transition: color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .tool-card:hover .tool-card-desc {
    color: #94a3b8;
  }
  .tool-card-icon {
    display: inline-block;
    transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .tool-card:hover .tool-card-icon {
    transform: scale(1.08);
  }
  .tool-badge-creator { position: absolute; top: 12px; right: 12px; font-size: 9px; font-family: monospace; color: #2dd4bf; background-color: rgba(45,212,191,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(45,212,191,0.2); }
  
  .dashboard-banner { background: linear-gradient(to right, rgba(15,23,42,0.8), rgba(2,6,23,0.8)); border: 1px dashed #eab308; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .limit-warning-banner-safe { background-color: rgba(52, 211, 153, 0.1); border: 1px solid #34d399; border-radius: 8px; padding: 12px; color: #6ee7b7; font-size: 12px; text-align: center; margin-bottom: 16px; font-family: monospace; transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms cubic-bezier(0.22, 1, 0.36, 1), color 300ms cubic-bezier(0.22, 1, 0.36, 1); }
  .limit-warning-banner-danger { background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; color: #f87171; font-size: 12px; text-align: center; margin-bottom: 16px; font-family: monospace; transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms cubic-bezier(0.22, 1, 0.36, 1), color 300ms cubic-bezier(0.22, 1, 0.36, 1); }
  
  .textarea-input { width: 100%; height: 120px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-size: 12px; color: #cbd5e1; font-family: monospace; resize: none; box-sizing: border-box; }
  .btn-generate { width: 100%; padding: 12px; background: linear-gradient(to right, #2dd4bf, #34d399); color: #020617; font-weight: bold; font-size: 12px; border: none; border-radius: 8px; cursor: pointer; margin-top: 12px; }
  .output-box { padding: 16px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; font-size: 12px; color: #e2e8f0; white-space: pre-wrap; margin-top: 16px; }
  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .output-content {
    white-space: pre-wrap;
    line-height: 1.7;
  }
  
  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #16223d;
    color: #cbd5e1;
    cursor: pointer;
    transition: all .2s ease;
  }
  
  .copy-button:hover {
    background: #233554;
    border-color: #2dd4bf;
    color: #2dd4bf;
  }
  
  .copy-button:active {
    transform: scale(.95);
  }
  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .copy-button {
    background: #1e293b;
    border: 1px solid #334155;
    color: #cbd5e1;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 200ms ease;
  }
  
  .copy-button:hover {
    background: #334155;
    color: #ffffff;
  }
  
  .output-content {
    white-space: pre-wrap;
  }
  .overlay-bg { position: fixed; inset: 0; background-color: rgba(2, 6, 23, 0.95); z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
  .overlay-card { width: 100%; max-width: 32rem; padding: 24px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; text-align: center; }
  .spinner-ring { width: 48px; height: 48px; border: 4px solid #1e293b; border-top-color: #2dd4bf; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px auto; }
  .interstitial-ad { width: 100%; height: 100px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748b; font-family: monospace; margin-top: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 1279px) { .ad-skyscraper { display: none; } }

  .btn-back { background: none; border: none; color: #2dd4bf; font-size: 12px; font-family: monospace; cursor: pointer; padding: 0; margin-bottom: 16px; text-align: left; }
  .btn-back:hover { color: #5eead4; text-decoration: underline; }
  .tool-header-title { font-size: 20px; font-weight: 900; color: #f8fafc; margin: 0 0 4px 0; }
  .tool-header-seo { font-size: 11px; color: #64748b; font-family: monospace; margin: 0; }
  .btn-other-tools {
    background-color: #0f172a;
    border: 1px solid #1e293b;
    color: #34d399;
    font-size: 12px;
    font-weight: bold;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-family: monospace;
    transform: scale(1) translateY(0);
    transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                background-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .btn-other-tools:hover {
    transform: scale(1.03) translateY(-2px);
    border-color: rgba(45, 212, 191, 0.5);
    background-color: #16223d;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3), 0 0 16px rgba(45, 212, 191, 0.12);
  }

  .btn-create-earn {
    background: linear-gradient(to right, #eab308, #ca8a04);
    border: none;
    color: #020617;
    font-size: 12px;
    font-weight: bold;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-family: monospace;
    transform: scale(1) translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                background 300ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .btn-create-earn:hover {
    transform: scale(1.03) translateY(-2px);
    background: linear-gradient(to right, #facc15, #eab308);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3), 0 0 20px rgba(234, 179, 8, 0.35);
  }

  .btn-nav-login {
    background: none;
    border: 1px solid #1e293b;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    transform: scale(1);
    transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .btn-nav-login:hover {
    transform: scale(1.05);
    border-color: rgba(148, 163, 184, 0.6);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .btn-nav-signup {
    background: linear-gradient(to right, #2dd4bf, #34d399);
    border: none;
    color: #020617;
    font-weight: bold;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    transform: scale(1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .btn-nav-signup:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), 0 0 14px rgba(45, 212, 191, 0.3);
  }

  @media (prefers-reduced-motion: reduce) {
    .tool-card, .tool-card-title, .tool-card-desc, .tool-card-icon,
    .btn-other-tools, .btn-create-earn, .btn-nav-login, .btn-nav-signup {
      transition: none;
    }
    .tool-card:hover, .btn-other-tools:hover, .btn-create-earn:hover,
    .btn-nav-login:hover, .btn-nav-signup:hover {
      transform: none;
    }
  }
  `;

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
      <style>{STYLES_INJECTION}</style>

      <div className="ad-col-left">
        <AdsterraSkyscraper />
      </div>

      <div className="scroll-center">
        <div className="scroll-center-inner">
          {children}
        </div>
      </div>

      <div className="ad-col-right">
        <AdsterraSkyscraper />
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
        <div className="interstitial-ad">Interstitial_Ad_Slot_Hidden</div>
      </div>
    </div>
  );
}

export default function App() {
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
const [popunderWindowRef, setPopunderWindowRef] = useState<Window | null>(null);

// --- NEW: Tier 3 unlimited-mode state ---
const [unlimitedModeActive, setUnlimitedModeActive] = useState(false);
const [unlimitedSecondsLeft, setUnlimitedSecondsLeft] = useState(10);
const [pendingUnlimitedPayload, setPendingUnlimitedPayload] = useState<{
  promptInstructions: string;
  userInput: string;
  onDone: (output: string) => void;
} | null>(null);
const startUnlock = async () => {
  const adWindow = triggerPopunderAd();
  setPopunderWindowRef(adWindow);

  try {
    const res = await fetch('/api/unlock-start', { method: 'POST' });
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
  if (popunderWindowRef && !popunderWindowRef.closed) {
    popunderWindowRef.close();
  }
  try {
    const res = await fetch('/api/unlock-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const adWindow = triggerPopunderAd(); // must stay synchronous inside the click chain
  setPopunderWindowRef(adWindow);

  try {
    const res = await fetch('/api/unlock-start', { method: 'POST' });
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

  if (popunderWindowRef && !popunderWindowRef.closed) {
    popunderWindowRef.close();
  }

  try {
    const res = await fetch('/api/run-unlimited-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    injectSocialBar();
  }, []);

  useEffect(() => {
    const fetchUsageStatus = async () => {
      try {
        const res = await fetch('/api/usage-status');
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
          Ad unlocks used today: {adUnlocksUsed}/3
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
        <button onClick={() => setRoute('hub')} className="btn-back">
          &larr; Return To Boutique Mall Lobby
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
      {route === "other-tools" && (
  <div>

    <h2 className="tool-header-title">
      Other Tools
    </h2>

    <p className="tool-header-seo">
      Experimental tools currently in development.
    </p>

    <div
      className="grid-container"
      style={{ marginTop: "24px" }}
    >

<div
  onClick={() => {
    setRoute("pirate");
  }}
  className="tool-card"
>
  <span className="tool-badge-creator">
    Community
  </span>

  <h3 className="tool-card-title">
    Pirate Translator
  </h3>

  <p className="tool-card-desc">
    Converts normal English into classic pirate speech.
  </p>

</div>

      <div
        className="tool-card"
        style={{
          opacity: .45,
          cursor: "default"
        }}
      >

        <h3 className="tool-card-title">
          Metadata Privacy Shield
        </h3>

        <p className="tool-card-desc">
          Coming Soon
        </p>

      </div>

      <div
        className="tool-card"
        style={{
          opacity: .45,
          cursor: "default"
        }}
      >

        <h3 className="tool-card-title">
          Intelligent Transcript Structurer
        </h3>

        <p className="tool-card-desc">
          Coming Soon
        </p>

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
      <div className="spinner-ring"></div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Verifying sponsorship tier...</h3>
      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
        {unlockSecondsLeft} seconds remaining
      </p>
    </div>
  </div>
)}

{unlimitedModeActive && (
  <div className="overlay-bg">
    <div className="overlay-card">
      <div className="spinner-ring"></div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Sponsor View Required...</h3>
      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
        {unlimitedSecondsLeft} seconds remaining
      </p>
    </div>
  </div>
)}
  {processing && <ProcessingOverlay message={msg} onComplete={handleComplete} />}
</AdLayoutWrapper>
  );
}