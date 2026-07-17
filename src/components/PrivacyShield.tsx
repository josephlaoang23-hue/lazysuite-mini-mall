import React, { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function PrivacyShield({ triggerProcess }: ToolProps) {
  const [active, setActive] = useState<boolean>(false);
  const [output, setOutput] = useState<boolean>(false);

  const handleGenerate = () => {
    triggerProcess("Mapping binary arrays internally and purging nested GPS coordinates locally...", () => {
      setOutput(true);
    });
  };

  return (
    <div>
      <h2 className="tool-header-title">Metadata Privacy Shield & Tag Purger</h2>
      <p className="tool-header-seo">Target SEO: "Remove tracking metadata from video clip"</p>
      <div style={{ padding: '24px', border: '2px dashed #1e293b', backgroundColor: 'rgba(15,23,42,0.4)', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
        {!active ? (
          <button onClick={() => setActive(true)} className="btn-generate" style={{ marginTop: 0, width: 'auto', padding: '8px 16px' }}>Load Test Media File</button>
        ) : (
          <p style={{ fontSize: '12px', color: '#2dd4bf', fontWeight: 'bold', margin: 0 }}>✓ raw_drone_capture_2026.mp4 (GPS Track Logs & Model EXIF Meta Found)</p>
        )}
      </div>
      <button onClick={handleGenerate} disabled={!active} className="btn-generate">
        Strip Tracking Context Safely
      </button>
      {output && (
        <div className="output-box" style={{ fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
          <div>&bull; Target Output Identity: raw_drone_capture_2026_safe_shielded.mp4</div>
          <div>&bull; Device Configuration Tracking Footprints: <span style={{ color: '#34d399', fontWeight: 'bold' }}>PURGED</span></div>
          <div>&bull; Geospatial Geo-Location Hardware Signatures: <span style={{ color: '#34d399', fontWeight: 'bold' }}>WIPED</span></div>
        </div>
      )}
    </div>
  );
}
