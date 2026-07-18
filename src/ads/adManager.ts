import { POPUNDER_URL, SOCIAL_BAR_URL } from './adConfig';

let lastAdTrigger = 0;
const AD_COOLDOWN = 5000;

export function triggerPopunderAd() {
  const now = Date.now();
  if (now - lastAdTrigger < AD_COOLDOWN) {
    return;
  }
  lastAdTrigger = now;

  const adWindow = window.open(POPUNDER_URL, "_blank");

  if (adWindow) {
    adWindow.blur();
    window.focus();
  }
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