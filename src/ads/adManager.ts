let lastAdTime = 0;

const AD_COOLDOWN = 5000;

export function triggerPopunderAd() {

  const now = Date.now();

  // Prevent spam clicks
  if (now - lastAdTime < AD_COOLDOWN) {
    return false;
  }

  lastAdTime = now;


  // Replace this later with your real ad network URL
  const adUrl = "https://your-ad-network-url.com";


  window.open(
    adUrl,
    "_blank",
    "noopener,noreferrer"
  );


  return true;
}