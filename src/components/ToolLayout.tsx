import type { ReactNode } from "react";
import AdsterraNativeBanner from "../ads/AdsterraNativeBanner";

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

        {/* Secondary ad slot — sits directly under each tool's visual output */}
        <div className="tool-layout-sticky-ad">
          <AdsterraNativeBanner />
        </div>
      </div>
    </div>
  );
}