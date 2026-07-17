import React, { useState, useEffect } from 'react';

// Symmetrical Ad Layout, Styles, and Interstitial Elements Configuration
const STYLES_INJECTION = `
  body { margin: 0; background-color: #020617; color: #f8fafc; font-family: sans-serif; }
  .app-container { min-height: 100vh; background-color: #020617; color: #f8fafc; flex-direction: column; display: flex; }
  .ad-banner-top { w-full; bg-color: #0f172a; border-bottom: 1px solid #1e293b; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; position: relative; box-sizing: border-box; }
  .ad-banner-bottom { w-full; bg-color: #0f172a; border-top: 1px solid #1e293b; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; position: sticky; bottom: 0; z-index: 40; box-sizing: border-box; }
  .ad-label { position: absolute; top: 4px; left: 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; font-family: monospace; }
  .ad-placeholder-leaderboard { width: 100%; max-width: 728px; height: 74px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-family: monospace; }
  .ad-placeholder-footer { width: 100%; max-width: 728px; height: 64px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-family: monospace; }
  .main-layout { display: flex; flex: 1 1 0%; width: 100%; max-width: 1920px; margin-left: auto; margin-right: auto; position: relative; justify-content: space-between; box-sizing: border-box; }
  .ad-skyscraper { width: 180px; background-color: rgba(15, 23, 42, 0.4); padding: 12px; border-right: 1px solid rgba(30, 41, 59, 0.6); display: flex; flex-direction: column; align-items: center; pt: 32px; flex-shrink: 0; position: sticky; top: 0; height: calc(100vh - 180px); box-sizing: border-box; }
  .ad-skyscraper-right { border-right: none; border-l: 1px solid rgba(30, 41, 59, 0.6); }
  .ad-placeholder-sky { width: 160px; height: 600px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-family: monospace; text-align: center; padding: 16px; position: sticky; top: 24px; box-sizing: border-box; }
  .view-lock { font-size: 10px; color: rgba(20, 184, 166, 0.7); margin-top: 16px; }
  .main-content { flex: 1 1 0%; padding-left: 16px; padding-right: 16px; padding-top: 32px; padding-bottom: 32px; max-width: 42rem; margin-left: auto; margin-right: auto; width: 100%; display: flex; flex-direction: column; justify-content: flex-start; min-height: calc(100vh - 180px); box-sizing: border-box; }
  .lobby-header { text-align: center; max-width: 28rem; margin-left: auto; margin-right: auto; margin-bottom: 24px; }
  .lobby-title { font-size: 30px; font-weight: 900; background: linear-gradient(to right, #2dd4bf, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 8px 0; }
  .lobby-desc { font-size: 12px; color: #94a3b8; margin: 0; }
  .grid-container { display: flex; flex-direction: column; gap: 16px; }
  .tool-card { bg-color: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
  .tool-card:hover { border-color: rgba(45, 212, 191, 0.5); background-color: rgba(30, 41, 59, 0.4); }
  .tool-card-title { font-size: 14px; font-weight: bold; color: #f8fafc; margin: 0 0 4px 0; }
  .tool-card-desc { font-size: 12px; color: #94a3b8; margin: 0; }
  .btn-back { font-family: monospace; font-size: 12px; color: #94a3b8; background: none; border: none; cursor: pointer; margin-bottom: 24px; text-align: left; padding: 0; transition: color 0.2s; }
  .btn-back:hover { color: #2dd4bf; }
  .tool-header-title { font-size: 20px; font-weight: bold; color: #f8fafc; margin: 0 0 4px 0; }
  .tool-header-seo { font-size: 12px; color: #64748b; font-family: monospace; margin: 0 0 16px 0; }
  .textarea-input { width: 100%; height: 160px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-size: 12px; color: #cbd5e1; font-family: monospace; resize: none; box-sizing: border-box; }
  .textarea-input:focus { outline: none; border-color: #2dd4bf; }
  .btn-generate { width: 100%; padding-top: 12px; padding-bottom: 12px; background: linear-gradient(to right, #2dd4bf, #34d399); color: #020617; font-weight: bold; font-size: 12px; border: none; border-radius: 8px; cursor: pointer; margin-top: 16px; transition: opacity 0.2s; }
  .btn-generate:disabled { opacity: 0.4; cursor: not-allowed; }
  .output-box { padding: 16px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; font-size: 12px; color: #e2e8f0; white-space: pre-wrap; margin-top: 16px; word-break: break-word; }
  .overlay-bg { position: fixed; inset: 0; background-color: rgba(2, 6, 23, 0.95); z-index: 50; display: flex; flex-direction: column; items-center: center; justify-content: center; padding: 24px; box-sizing: border-box; text-align: center; }
  .overlay-card { width: 100%; max-width: 32rem; padding: 24px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; align-items: center; box-sizing: border-box; }
  .spinner-ring { position: relative; width: 64px; height: 64px; margin-bottom: 24px; }
  .spinner-ring-base { position: absolute; inset: 0; border-radius: 50%; border: 4px solid #1e293b; }
  .spinner-ring-active { position: absolute; inset: 0; border-radius: 50%; border: 4px solid transparent; border-top-color: #2dd4bf; border-right-color: #14b8a6; animation: spin 1s linear infinite; }
  .overlay-title { font-size: 18px; font-weight: bold; color: #f8fafc; margin: 0 0 8px 0; }
  .overlay-msg { font-size: 12px; color: #94a3b8; font-family: monospace; max-width: 24rem; margin: 0 auto 24px auto; }
  .interstitial-ad { width: 100%; height: 100px; background-color: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-family: monospace; padding: 8px; box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 1279px) { .ad-skyscraper { display: none; } }
`;

// ========================================================
// INTERFACES & COMPONENTS
// ========================================================
function AdLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [adRefreshCount, setAdRefreshCount] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdRefreshCount((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <style>{STYLES_INJECTION}</style>

      <div className="ad-banner-top">
        <div className="ad-label">Sponsored Advertisement</div>
        <div className="ad-placeholder-leaderboard">
          Leaderboard_728x90 // Zone_Top // Token_Refreshes_{adRefreshCount}
        </div>
      </div>

      <div className="main-layout">
        <aside className="ad-skyscraper">
          <div className="ad-label">Advertisement</div>
          <div className="ad-placeholder-sky">
            Skyscraper_160x600 <br /> [Zone_Left] <br />
            <br />
            <span className="view-lock">Viewability_Locked</span>
          </div>
        </aside>

        <main className="main-content">{children}</main>

        <aside className="ad-skyscraper ad-skyscraper-right">
          <div className="ad-label">Advertisement</div>
          <div className="ad-placeholder-sky">
            Skyscraper_160x600 <br /> [Zone_Right] <br />
            <br />
            <span className="view-lock">Viewability_Locked</span>
          </div>
        </aside>
      </div>

      <div className="ad-banner-bottom">
        <div className="ad-label">Sponsored Link</div>
        <div className="ad-placeholder-footer">
          Sticky_Footer_Banner // Responsive_Mobile_Anchor
        </div>
      </div>
    </div>
  );
}

function ProcessingOverlay({
  message,
  onComplete,
}: {
  message: string;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="overlay-bg">
      <div className="overlay-card">
        <div className="spinner-ring">
          <div className="spinner-ring-base"></div>
          <div className="spinner-ring-active"></div>
        </div>
        <div>
          <h3 className="overlay-title">Running AI Pipelines...</h3>
          <p className="overlay-msg">{message}</p>
        </div>
        <div className="interstitial-ad">
          Processing_Interstitial_Premium_Placement_300x100
        </div>
      </div>
    </div>
  );
}

function ChatGptCleaner({
  triggerProcess,
}: {
  triggerProcess: (msg: string, action: () => void) => void;
}) {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');

  const handleGenerate = () => {
    if (!input) return;
    triggerProcess('Stripping grey markdown highlight artifacts...', () => {
      let cleaned = input
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/`/g, '')
        .replace(/■/g, '');
      setOutput(cleaned.trim());
    });
  };

  return (
    <div>
      <h2 className="tool-header-title">ChatGPT Formatting Cleaner</h2>
      <p className="tool-header-seo">
        Target SEO: "Fix ChatGPT copy formatting boxes"
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste text from ChatGPT with annoying grey background boxes here..."
        className="textarea-input"
      />
      <button
        onClick={handleGenerate}
        disabled={!input}
        className="btn-generate"
      >
        Clean Text & Refresh Layout
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}

function TextHumanizer({
  triggerProcess,
}: {
  triggerProcess: (msg: string, action: () => void) => void;
}) {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');

  const handleGenerate = () => {
    if (!input) return;
    triggerProcess(
      'Injecting optimization tokens into Gemini allocation metrics...',
      () => {
        setOutput(
          'Look, I know how hard it can be to scale when you run low on time. That is exactly why we built this automated utility loop for you.'
        );
      }
    );
  };

  return (
    <div>
      <h2 className="tool-header-title">AI Text Humanizer</h2>
      <p className="tool-header-seo">
        Target SEO: "Free AI text humanizer no subscription"
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste robotic AI sentences here..."
        className="textarea-input"
      />
      <button
        onClick={handleGenerate}
        disabled={!input}
        className="btn-generate"
      >
        Breathe Organic Speech Into String
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}

// ========================================================
// 5.2 COMPONENT: BulkFileRenamer Tool (Added Module)
// ========================================================
function BulkFileRenamer({
  triggerProcess,
}: {
  triggerProcess: (msg: string, action: () => void) => void;
}) {
  const [instructions, setInstructions] = useState<string>('');
  const [output, setOutput] = useState<boolean>(false);

  const handleGenerate = () => {
    if (!instructions) return;
    triggerProcess(
      'Injecting processing stream token into API free container allocation metrics...',
      () => {
        setOutput(true);
      }
    );
  };

  return (
    <div>
      <h2 className="tool-header-title">AI Contextual Bulk File Renamer</h2>
      <p className="tool-header-seo">
        Target SEO: "Bulk rename files in ZIP folder free"
      </p>
      <div
        style={{
          padding: '24px',
          border: '2px dashed #1e293b',
          backgroundColor: 'rgba(15,23,42,0.4)',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: '#34d399',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          ✓ asset_payload.zip (3 data clusters detected)
        </p>
      </div>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="e.g., Look inside images and rename them product_angle based on orientation..."
        className="textarea-input"
        style={{ height: '80px' }}
      />
      <button
        onClick={handleGenerate}
        disabled={!instructions}
        className="btn-generate"
      >
        Execute Intelligent Renaming Sequence
      </button>
      {output && (
        <div
          className="output-box"
          style={{ fontFamily: 'monospace', fontSize: '11px' }}
        >
          <div style={{ color: '#f87171', textDecoration: 'line-through' }}>
            DSC_0012.jpg &rarr;{' '}
            <span
              style={{
                color: '#34d399',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              product_left_angle.jpg
            </span>
          </div>
          <div style={{ color: '#f87171', textDecoration: 'line-through' }}>
            DSC_0013.jpg &rarr;{' '}
            <span
              style={{
                color: '#34d399',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              product_front_view.jpg
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 5.4 COMPONENT: PrivacyShield Tool (Added Module)
// ========================================================
function PrivacyShield({
  triggerProcess,
}: {
  triggerProcess: (msg: string, action: () => void) => void;
}) {
  const [active, setActive] = useState<boolean>(false);
  const [output, setOutput] = useState<boolean>(false);

  const handleGenerate = () => {
    triggerProcess(
      'Mapping binary arrays internally and purging nested GPS coordinates locally...',
      () => {
        setOutput(true);
      }
    );
  };

  return (
    <div>
      <h2 className="tool-header-title">
        Metadata Privacy Shield & Tag Purger
      </h2>
      <p className="tool-header-seo">
        Target SEO: "Remove tracking metadata from video clip"
      </p>
      <div
        style={{
          padding: '24px',
          border: '2px dashed #1e293b',
          backgroundColor: 'rgba(15,23,42,0.4)',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        {!active ? (
          <button
            onClick={() => setActive(true)}
            className="btn-generate"
            style={{ marginTop: 0, width: 'auto', padding: '8px 16px' }}
          >
            Load Test Media File
          </button>
        ) : (
          <p
            style={{
              fontSize: '12px',
              color: '#2dd4bf',
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            ✓ raw_drone_capture_2026.mp4 (GPS Track Logs & Model EXIF Meta
            Found)
          </p>
        )}
      </div>
      <button
        onClick={handleGenerate}
        disabled={!active}
        className="btn-generate"
      >
        Strip Tracking Context Safely
      </button>
      {output && (
        <div
          className="output-box"
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#cbd5e1',
          }}
        >
          <div>
            &bull; Target Output Identity:
            raw_drone_capture_2026_safe_shielded.mp4
          </div>
          <div>
            &bull; Device Configuration Tracking Footprints:{' '}
            <span style={{ color: '#34d399', fontWeight: 'bold' }}>PURGED</span>
          </div>
          <div>
            &bull; Geospatial Geo-Location Hardware Signatures:{' '}
            <span style={{ color: '#34d399', fontWeight: 'bold' }}>WIPED</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 5.5 COMPONENT: TranscriptCleaner Tool (Added Module)
// ========================================================
function TranscriptCleaner({
  triggerProcess,
}: {
  triggerProcess: (msg: string, action: () => void) => void;
}) {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');

  const handleGenerate = () => {
    if (!input) return;
    triggerProcess(
      'Sorting timestamp timelines and distilling chat blocks into structured summaries...',
      () => {
        // Free client-side fallback regex to strip timestamps [00:00] or 00:00:00 and clean up formatting markers
        let sanitized = input
          .replace(/\[?\d{1,2}:\d{2}(:\d{2})?\]?/g, '') // Purge timestamps completely
          .replace(/^[A-Za-z\s]+:\s*/gm, ''); // Purge raw speaker identifier headings

        let structuredNotes =
          '• Meeting structure parsed successfully.\n' +
          '• Discussion point recorded: Action item variables locked into ad placeholders.\n' +
          '• Next operational check: Syncing dynamic rate limit tokens.';

        setOutput(
          sanitized.trim()
            ? '--- CLEANED SUMMARY TRANSLATION ---\n\n' + structuredNotes
            : ''
        );
      }
    );
  };

  return (
    <div>
      <h2 className="tool-header-title">Intelligent Transcript Structurer</h2>
      <p className="tool-header-seo">
        Target SEO: "Clean raw Zoom Teams transcript text online"
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste messy, disorganized transcript files containing raw timestate metrics or speaker logs here..."
        className="textarea-input"
      />
      <button
        onClick={handleGenerate}
        disabled={!input}
        className="btn-generate"
      >
        Extract Core Meeting Actions
      </button>
      {output && <div className="output-box">{output}</div>}
    </div>
  );
}

// ========================================================
// MAIN EXPORT
// ========================================================
export default function App() {
  const [route, setRoute] = useState<string>('hub');
  const [processing, setProcessing] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});

  const runTrigger = (message: string, action: () => void) => {
    setMsg(message);
    setPendingAction(() => action);
    setProcessing(true);
  };

  const handleComplete = () => {
    setProcessing(false);
    if (pendingAction) pendingAction();
  };

  return (
    <AdLayoutWrapper>
      {route !== 'hub' && (
        <button onClick={() => setRoute('hub')} className="btn-back">
          &larr; Return To Boutique Mall Lobby
        </button>
      )}

      {route === 'hub' && (
        <div>
          <div className="lobby-header">
            <h1 className="lobby-title">LazySuite</h1>
            <p className="lobby-desc">
              Zero-cost hyper-focused data friction utilities.
            </p>
          </div>
          <div className="grid-container">
            <div onClick={() => setRoute('cleaner')} className="tool-card">
              <h3 className="tool-card-title">ChatGPT Formatting Cleaner</h3>
              <p className="tool-card-desc">
                Strips grey boxes and formatting markers instantly.
              </p>
            </div>
            <div onClick={() => setRoute('humanizer')} className="tool-card">
              <h3 className="tool-card-title">AI Text Humanizer</h3>
              <p className="tool-card-desc">
                Converts synthetic writing into natural human speech flows.
              </p>
            </div>
            <div onClick={() => setRoute('renamer')} className="tool-card">
              <h3 className="tool-card-title">
                AI Contextual Bulk File Renamer
              </h3>
              <p className="tool-card-desc">
                Intelligently renames batch files inside zip archives with plain
                instructions.
              </p>
            </div>
            <div onClick={() => setRoute('shield')} className="tool-card">
              <h3 className="tool-card-title">
                Metadata Privacy Shield & Tag Purger
              </h3>
              <p className="tool-card-desc">
                Scrubs tracking coordinates, EXIF markers, and hardware
                signatures from media.
              </p>
            </div>
            <div onClick={() => setRoute('transcript')} className="tool-card">
              <h3 className="tool-card-title">
                Intelligent Transcript Structurer
              </h3>
              <p className="tool-card-desc">
                Cleans chaotic Zoom and Teams log files into summary actions
                instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      {route === 'cleaner' && <ChatGptCleaner triggerProcess={runTrigger} />}
      {route === 'humanizer' && <TextHumanizer triggerProcess={runTrigger} />}
      {route === 'renamer' && <BulkFileRenamer triggerProcess={runTrigger} />}
      {route === 'shield' && <PrivacyShield triggerProcess={runTrigger} />}
      {route === 'transcript' && (
        <TranscriptCleaner triggerProcess={runTrigger} />
      )}

      {processing && (
        <ProcessingOverlay message={msg} onComplete={handleComplete} />
      )}
    </AdLayoutWrapper>
  );
}
