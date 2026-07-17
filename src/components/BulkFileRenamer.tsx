import React, { useState } from 'react';

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

export default function BulkFileRenamer({ triggerProcess }: ToolProps) {
  const [instructions, setInstructions] = useState<string>("");
  const [output, setOutput] = useState<boolean>(false);

  const handleGenerate = () => {
    if (!instructions) return;
    triggerProcess("Injecting processing stream token into API free container allocation metrics...", () => {
      setOutput(true);
    });
  };

  return (
    <div>
      <h2 className="tool-header-title">AI Contextual Bulk File Renamer</h2>
      <p className="tool-header-seo">Target SEO: "Bulk rename files in ZIP folder free"</p>
      <div style={{ padding: '24px', border: '2px dashed #1e293b', backgroundColor: 'rgba(15,23,42,0.4)', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: '#34d399', fontWeight: 'bold', margin: 0 }}>✓ asset_payload.zip (3 data clusters detected)</p>
      </div>
      <textarea 
        value={instructions} 
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="e.g., Look inside images and rename them product_angle based on orientation..." 
        className="textarea-input"
        style={{ height: '80px' }}
      />
      <button onClick={handleGenerate} disabled={!instructions} className="btn-generate">
        Execute Intelligent Renaming Sequence
      </button>
      {output && (
        <div className="output-box" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          <div style={{ color: '#f87171', textDecoration: 'line-through' }}>DSC_0012.jpg &rarr; <span style={{ color: '#34d399', textDecoration: 'none', fontWeight: 'bold' }}>product_left_angle.jpg</span></div>
          <div style={{ color: '#f87171', textDecoration: 'line-through' }}>DSC_0013.jpg &rarr; <span style={{ color: '#34d399', textDecoration: 'none', fontWeight: 'bold' }}>product_front_view.jpg</span></div>
        </div>
      )}
    </div>
  );
}
