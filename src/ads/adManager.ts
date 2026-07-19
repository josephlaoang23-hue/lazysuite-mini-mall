import { POPUNDER_URL, SOCIAL_BAR_URL } from './adConfig';

let lastAdTrigger = 0;
const AD_COOLDOWN = 5000;

export function triggerPopunderAd(): void {
  const now = Date.now();
  if (now - lastAdTrigger < AD_COOLDOWN) {
    return;
  }
  lastAdTrigger = now;

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = POPUNDER_URL;
  script.async = true;
  document.body.appendChild(script);
}

let socialBarInjected = false;

export function injectSocialBar() {
  if (socialBarInjected) return;
  socialBarInjected = true;

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = SOCIAL_BAR_URL;
  script.async = true;
  document.body.appendChild(script);
}