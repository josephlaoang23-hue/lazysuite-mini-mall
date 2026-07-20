import type { ReactNode } from "react";

interface ToolLayoutProps {
  controls: ReactNode;
  canvas: ReactNode;
}

export default function ToolLayout({ controls, canvas }: ToolLayoutProps) {
  return (
    <div className="tool-layout">
      <div className="tool-layout-controls">
        {controls}
      </div>

      <div className="tool-layout-canvas-column">
        <div className="tool-layout-canvas">
          {canvas}
        </div>

        {/* Secondary sticky ad slot — sits directly under each tool's visual output */}
        <div className="tool-layout-sticky-ad">
          <span>SECONDARY_AD_SLOT</span>
        </div>
      </div>
    </div>
  );
}