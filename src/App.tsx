import React, { useState, useEffect } from 'react';

// Import our individual clean modular component files directly from our folder pool
import ChatGptCleaner from './components/ChatGptCleaner';
import TextHumanizer from './components/TextHumanizer';
import BulkFileRenamer from './components/BulkFileRenamer';
import PrivacyShield from './components/PrivacyShield';
import TranscriptCleaner from './components/TranscriptCleaner';

// Symmetrical Ad Layout, Marketplace Theme, and Interstitial Style Architecture
const STYLES_INJECTION = `
  body { margin: 0; background-color: #020617; color: #f8fafc; font-family: sans-serif; }
  .app-container { min-height: 100vh; background-color: #020617; color: #f8fafc; flex-direction: column; display: flex; }
  .ad-banner-top { width: 100%; background-color: #0f172a; border-bottom: 1px solid #1e293b; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; position: relative; box-sizing: border-box; }
  .ad-banner-bottom { width: 100%; background-color: #0f172a; border-top: 1px solid #1e293b; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; position: sticky; bottom: 0; z-index: 40; box-sizing: border-box; }
  .ad-label { position: absolute; top: 4px; left: 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; font-family: monospace; }
  .ad-placeholder-leaderboard { width: 100%; max-width: 728px; height: 74px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-family: monospace; }
  .ad-placeholder-footer { width: 100%; max-width: 728px; height: 64px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-family: monospace; }
  .main-layout { display: flex; flex: 1 1 0%; width: 100%; max-width: 1920px; margin-left: auto; margin-right: auto; position: relative; justify-content: space-between; box-sizing: border-box; }
  .ad-skyscraper { width: 180px; background-color: rgba(15, 23, 42, 0.4); padding: 12px; border-right: 1px solid rgba(30, 41, 59, 0.6); display: flex; flex-direction: column; align-items: center; pt: 32px; flex-shrink: 0; position: sticky; top: 0; height: calc(100vh - 180px); box-sizing: border-box; }
  .ad-skyscraper-right { border-right: none; border-left: 1px solid rgba(30, 41, 59, 0.6); }
  .ad-placeholder-sky { width: 160px; height: 600px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-family: monospace; text-align: center; padding: 16px; position: sticky; top: 24px; box-sizing: border-box; }
  .view-lock { font-size: 10px; color: rgba(20, 184, 166, 0.7); margin-top: 16px; }
  .main-content { flex: 1 1 0%; padding-left: 16px; padding-right: 16px; padding-top: 32px; padding-bottom: 32px; max-width: 44rem; margin-left: auto; margin-right: auto; width: 100%; display: flex; flex-direction: column; justify-content: flex-start; min-height: calc(100vh - 180px); box-sizing: border-box; }
  
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
  .tool-card { background-color: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s; position: relative; }
  .tool-card:hover { border-color: rgba(45, 212, 191, 0.5); background-color: rgba(30, 41, 59, 0.4); }
  .tool-card-title { font-size: 14px; font-weight: bold; color: #f8fafc; margin: 0 0 4px 0; }
  .tool-card-desc { font-size: 12px; color: #94a3b8; margin: 0; }
  .tool-badge-creator { position: absolute; top: 12px; right: 12px; font-size: 9px; font-family: monospace; color: #2dd4bf; background-color: rgba(45,212,191,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(45,212,191,0.2); }
  
  .dashboard-banner { background: linear-gradient(to right, rgba(15,23,42,0.8), rgba(2,6,23,0.8)); border: 1px dashed #eab308; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  
  .textarea-input { width: 100%; height: 120px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-size: 12px; color: #cbd5e1; font-family: monospace; resize: none; box-sizing: border-box; }
  .btn-generate { width: 100%; padding: 12px; background: linear-gradient(to right, #2dd4bf, #34d399); color: #020617; font-weight: bold; font-size: 12px; border: none; border-radius: 8px; cursor: pointer; margin-top: 12px; }
  .output-box { padding: 16px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; font-size: 12px; color: #e2e8f0; white-space: pre-wrap; margin-top: 16px; }
  
  .overlay-bg { position: fixed; inset: 0; background-color: rgba(2, 6, 23, 0.95); z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
  .overlay-card { width: 100%; max-width: 32rem; padding: 24px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; text-align: center; }
  .spinner-ring { width: 48px; height: 48px; border: 4px solid #1e293b; border-top-color: #2dd4bf; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px auto; }
  .interstitial-ad { width: 100%; height: 100px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748b; font-family: monospace; margin-top: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 1279px) { .ad-skyscraper { display: none; } }
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
  const [adRefreshCount, setAdRefreshCount] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => { setAdRefreshCount(prev => prev + 1); }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <style>{STYLES_INJECTION}</style>
      <div className="ad-banner-top"><div className="ad-label">Sponsored Advertisement</div><div className="ad-placeholder-leaderboard">Leaderboard_728x90 // Zone_Top // Token_Refreshes_{adRefreshCount}</div></div>
      <div className="main-layout">
        <aside className="ad-skyscraper"><div className="ad-label">Advertisement</div><div className="ad-placeholder-sky">Skyscraper_160x600 <br/> [Zone_Left] <br/><br/> <span className="view-lock">Viewability_Locked</span></div></aside>
        <main className="main-content">{children}</main>
        <aside className="ad-skyscraper ad-skyscraper-right"><div className="ad-label">Advertisement</div><div className="ad-placeholder-sky">Skyscraper_160x600 <br/> [Zone_Right] <br/><br/> <span className="view-lock">Viewability_Locked</span></div></aside>
      </div>
      <div className="ad-banner-bottom"><div className="ad-label">Sponsored Link</div><div className="ad-placeholder-footer">Sticky_Footer_Banner // Responsive_Mobile_Anchor</div></div>
    </div>
  );
}

function ProcessingOverlay({ message, onComplete }: { message: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => { onComplete(); }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="overlay-bg">
      <div className="overlay-card">
        <div className="spinner-ring"></div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Processing Stream Matrix...</h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{message}</p>
        <div className="interstitial-ad">Interstitial_High_RPM_Execution_Placement_300x100</div>
      </div>
    </div>
  );
}
export default function App() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [route, setRoute] = useState<string>('hub');
  const [processing, setProcessing] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  
  const [customTools, setCustomTools] = useState<CustomTool[]>([
    { id: 'pirate-joke', title: 'Pirate Translator', desc: 'Converts any plain input text into custom high-sea pirate speak strings.', promptInstructions: 'Translate the following text into pirate jargon:', creator: 'CaptainJack', usesCount: 42 }
  ]);

  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [formUser, setFormUser] = useState<string>("");

  const [toolTitle, setToolTitle] = useState<string>("");
  const [toolDesc, setToolDesc] = useState<string>("");
  const [toolPrompt, setToolPrompt] = useState<string>("");

  const [activeTool, setActiveTool] = useState<CustomTool | null>(null);
  const [toolInput, setToolInput] = useState<string>("");
  const [toolOutput, setToolOutput] = useState<string>("");

  const triggerProcess = (message: string, action: () => void) => {
    setMsg(message);
    setPendingAction(() => action);
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
              <span>Balance: <strong style={{ color: '#2dd4bf' }}>${user.walletBalance.toFixed(2)}</strong></span>
              {!user.isPremium && (
                <button className="btn-premium" onClick={() => setUser({ ...user, isPremium: true })}>Go Pro (0% Fees)</button>
              )}
              <button className="btn-logout" onClick={() => { setUser(null); setRoute('hub'); }}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'none', border: '1px solid #1e293b', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setAuthMode('login')}>Login</button>
              <button style={{ background: 'linear-gradient(to right, #2dd4bf, #34d399)', border: 'none', color: '#020617', fontWeight: 'bold', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setAuthMode('signup')}>Sign Up</button>
            </div>
          )}
        </div>
      </div>

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

<div className="lobby-header">
            <h1 className="lobby-title">LazySuite Mall</h1>
            <p className="lobby-desc">Launch hyper-focused data engines or engineer your own monetized micro-utility pipelines.</p>
            
            {/* ROADMAP HOOK DISCOVERY BUTTONS */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => alert("Coming in the next update!")}
                style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#34d399', fontSize: '12px', fontWeight: 'bold', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                📁 Other Tools
              </button>
              <button 
                onClick={() => alert("Coming in the next update!")}
                style={{ background: 'linear-gradient(to right, #eab308, #ca8a04)', border: 'none', color: '#020617', fontSize: '12px', fontWeight: 'bold', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                🔥 Create and Earn Money
              </button>
            </div>
          </div>


          <div className="section-label">Default Core Boutiques</div>
          <div className="grid-container" style={{ marginBottom: '24px' }}>
            <div onClick={() => setRoute('cleaner')} className="tool-card">
              <h3 className="tool-card-title">ChatGPT Copy-Paste Formatting Cleaner</h3>
              <p className="tool-card-desc">Strips annoying gray text background artifact sheets straight from prompt outputs.</p>
            </div>
            <div onClick={() => setRoute('humanizer')} className="tool-card">
              <h3 className="tool-card-title">Zero-Cost AI Conversational Text Humanizer</h3>
              <p className="tool-card-desc">Breathes organic prose sentence loops straight into rigid text layers.</p>
            </div>
            <div onClick={() => setRoute('renamer')} className="tool-card">
              <h3 className="tool-card-title">AI Contextual Bulk File Renamer</h3>
              <p className="tool-card-desc">Intelligently renames batch files inside zip archives with plain instructions.</p>
            </div>
            <div onClick={() => setRoute('shield')} className="tool-card">
              <h3 className="tool-card-title">Metadata Privacy Shield & Tag Purger</h3>
              <p className="tool-card-desc">Scrubs tracking coordinates, EXIF markers, and hardware signatures from media.</p>
            </div>
            <div onClick={() => setRoute('transcript')} className="tool-card">
              <h3 className="tool-card-title">Intelligent Transcript Structurer</h3>
              <p className="tool-card-desc">Cleans chaotic Zoom and Teams log files into summary actions instantly.</p>
            </div>
          </div>

          <div className="section-label">User-Generated App Marketplace (10% Commission Shared)</div>
          <div className="grid-container">
            {customTools.map(t => (
              <div key={t.id} onClick={() => { setActiveTool(t); setToolInput(""); setToolOutput(""); setRoute('run-custom'); }} className="tool-card">
                <span className="tool-badge-creator">By @{t.creator} ({t.usesCount} runs)</span>
                <h3 className="tool-card-title" style={{ paddingRight: '120px' }}>{t.title}</h3>
                <p className="tool-card-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {route === 'cleaner' && <ChatGptCleaner triggerProcess={triggerProcess} />}
      {route === 'humanizer' && <TextHumanizer triggerProcess={triggerProcess} />}
      {route === 'renamer' && <BulkFileRenamer triggerProcess={triggerProcess} />}
      {route === 'shield' && <PrivacyShield triggerProcess={triggerProcess} />}
      {route === 'transcript' && <TranscriptCleaner triggerProcess={triggerProcess} />}

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
          <button onClick={() => setRoute('hub')} className="btn-back">&larr; Back To Marketplace Grid</button>
          <h2 className="tool-header-title">{activeTool.title}</h2>
          <p className="tool-header-seo">Engineered Array Pipeline Managed by: <strong>@{activeTool.creator}</strong></p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '-8px', marginBottom: '16px' }}>{activeTool.desc}</p>
          
          <textarea value={toolInput} onChange={(e) => setToolInput(e.target.value)} placeholder="Enter your text to trigger the prompt logic execution loop..." className="textarea-input" />
          <button onClick={executeCustomTool} disabled={!toolInput} className="btn-generate">Execute Tool & Refresh Ad Placements</button>
          
          {toolOutput && <div className="output-box">{toolOutput}</div>}
        </div>
      )}

      {processing && <ProcessingOverlay message={msg} onComplete={handleComplete} />}
    </AdLayoutWrapper>
  );
}

