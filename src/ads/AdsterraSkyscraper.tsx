import { useEffect, useRef } from 'react';
import { ADSTERRA_SKYSCRAPER_KEY, ADSTERRA_SKYSCRAPER_SRC } from './adConfig';

export default function AdsterraSkyscraper() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    (window as any).atOptions = {
      key: ADSTERRA_SKYSCRAPER_KEY,
      format: 'iframe',
      height: 600,
      width: 160,
      params: {},
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = ADSTERRA_SKYSCRAPER_SRC;
    script.async = true;

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = '';
      delete (window as any).atOptions;
    };
  }, []);

  return <div ref={wrapperRef} style={{ width: 160, height: 600 }} />;
}