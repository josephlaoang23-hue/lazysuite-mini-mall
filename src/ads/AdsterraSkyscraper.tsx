import { useEffect, useRef } from 'react';
import { ADSTERRA_SKYSCRAPER_KEY, ADSTERRA_SKYSCRAPER_SRC } from './adConfig';

export default function AdsterraSkyscraper() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <body style="margin:0;padding:0;">
          <script type="text/javascript">
            atOptions = {
              key: '${ADSTERRA_SKYSCRAPER_KEY}',
              format: 'iframe',
              height: 600,
              width: 160,
              params: {}
            };
          </script>
          <script type="text/javascript" src="${ADSTERRA_SKYSCRAPER_SRC}"></script>
        </body>
      </html>
    `);
    doc.close();
  }, []);

  return (
    <iframe
      ref={iframeRef}
      style={{ width: 160, height: 600, border: 'none' }}
      title="advertisement"
    />
  );
}