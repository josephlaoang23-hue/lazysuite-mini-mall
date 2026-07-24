interface DiagramFullscreenProps {
    svg: string;
    title: string;
    onClose: () => void;
  }
  
  export default function DiagramFullscreen({ svg, title, onClose }: DiagramFullscreenProps) {
    const downloadSvg = () => {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    };
  
    return (
      <div className="diagram-fullscreen-overlay" onClick={onClose}>
        <div className="diagram-fullscreen-card" onClick={(e) => e.stopPropagation()}>
          <div className="diagram-fullscreen-header">
            <span>{title}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="copy-button" onClick={downloadSvg} title="Download as SVG file">
                Download SVG
              </button>
              <button className="copy-button" onClick={onClose} title="Close">
                ✕ Close
              </button>
            </div>
          </div>
          <div className="diagram-fullscreen-content" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>
    );
  }