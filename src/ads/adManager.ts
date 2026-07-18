let lastAdTrigger = 0;

const AD_COOLDOWN = 5000;

export function triggerPopunderAd() {

  const now = Date.now();

  if (now - lastAdTrigger < AD_COOLDOWN) {
    return;
  }

  lastAdTrigger = now;


  const adWindow = window.open(
    "https://your-ad-network-url.com",
    "_blank"
  );


  if (adWindow) {

    adWindow.blur();

    window.focus();

  }

}