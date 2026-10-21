// Loads YouTube's IFrame Player API once per page and resolves with window.YT.
// The reference clips stay on YouTube, embedded through its own player, so the
// creators keep the view and the credit; the demo only drives play, pause, and speed.
let pending = null;

export function loadYouTubeApi(timeoutMs = 10000) {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('YouTube player did not load')), timeoutMs);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      if (typeof previous === 'function') previous();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => { clearTimeout(timer); reject(new Error('YouTube player could not be reached')); };
    document.head.appendChild(script);
  }).catch((e) => { pending = null; throw e; });
  return pending;
}

export const shortsUrl = (id) => `https://www.youtube.com/shorts/${id}`;
