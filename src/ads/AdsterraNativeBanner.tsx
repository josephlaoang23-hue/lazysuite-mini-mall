import { useEffect, useRef } from 'react';
import { NATIVE_BANNER_SRC, NATIVE_BANNER_CONTAINER_PREFIX } from './adConfig';

export default function AdsterraNativeBanner() {
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
          <script async="async" data-cfasync="false" src="${NATIVE_BANNER_SRC}"></script>
          <div id="${NATIVE_BANNER_CONTAINER_PREFIX}"></div>
        </body>
      </html>
    `);
    doc.close();
  }, []);

  return (
    <iframe
      ref={iframeRef}
      style={{ width: '100%', minHeight: '100px', border: 'none', marginTop: '16px' }}
      title="advertisement"
    />
  );
}