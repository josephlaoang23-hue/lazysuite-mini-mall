import { useEffect, useRef, useId } from 'react';
import { NATIVE_BANNER_SRC, NATIVE_BANNER_CONTAINER_PREFIX } from './adConfig';

export default function AdsterraNativeBanner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/[:]/g, '');
  const containerId = `${NATIVE_BANNER_CONTAINER_PREFIX}-${reactId}`;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = NATIVE_BANNER_SRC;

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = '';
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', marginTop: '16px' }}>
      <div id={containerId}></div>
    </div>
  );
}