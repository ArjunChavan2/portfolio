import { useEffect, useRef, useState } from 'react';
import { loadYouTubeApi, shortsUrl } from './youtube';

const FALLBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const UNSTARTED = -1;
const PLAYING = 1;
const PAUSED = 2;

// The nearest speed this player supports (YouTube rounds anything else).
function snap(rate, available) {
  const rates = available?.length ? available : FALLBACK_RATES;
  return rates.reduce((best, r) => (Math.abs(r - rate) < Math.abs(best - rate) ? r : best), rates[0]);
}

/**
 * A YouTube Short in the robot's panel, kept in step with the demo. Play and Pause work in
 * both directions: the demo drives the clip, and the clip's own controls drive the robot.
 * Speed maps through `rate`, the clip's speed per unit of robot speed. A change to
 * `resetKey` rewinds it. Sound comes on with the first Play: browsers only allow audio
 * after a click on the page, and if one still refuses, the clip plays muted instead.
 */
export default function ReferenceVideo({
  videoId, title, credit, rate = 1, playing, speed, resetKey, onPlayingChange,
}) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [clipRate, setClipRate] = useState(null);
  const latest = useRef({});
  latest.current = { playing, speed, rate, onPlayingChange };
  const soundTried = useRef(false);
  const tryingSound = useRef(false);

  const applyRate = (player) => {
    const r = snap(latest.current.speed * latest.current.rate, player.getAvailablePlaybackRates?.());
    player.setPlaybackRate(r);
    setClipRate(r);
  };

  const start = (player) => {
    if (soundTried.current) {
      player.playVideo();
      return;
    }
    soundTried.current = true;
    tryingSound.current = true;
    player.unMute();
    player.setVolume?.(100);
    player.playVideo();
    // A browser that refuses sound leaves the clip paused or never starting: play it muted.
    setTimeout(() => {
      const p = playerRef.current;
      if (!p || !tryingSound.current) return;
      tryingSound.current = false;
      if (latest.current.playing && [PAUSED, UNSTARTED].includes(p.getPlayerState?.())) {
        p.mute();
        p.playVideo();
      }
    }, 1500);
  };

  // One player per mount. YouTube replaces the node it is given, so it gets a child
  // that React never renders into.
  useEffect(() => {
    let cancelled = false;
    const host = mountRef.current;
    const target = document.createElement('div');
    host.appendChild(target);
    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(target, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: { playsinline: 1, rel: 0, controls: 1, loop: 1, playlist: videoId },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            applyRate(e.target);
            if (latest.current.playing) start(e.target);
            setReady(true);
          },
          onStateChange: (e) => {
            if (cancelled) return;
            const { playing: robotPlaying, onPlayingChange: notify } = latest.current;
            if (e.data === PLAYING) tryingSound.current = false;
            if (e.data === PAUSED && tryingSound.current) {
              // The browser refused sound: that pause is not the viewer's, so keep the robot going.
              tryingSound.current = false;
              playerRef.current?.mute();
              playerRef.current?.playVideo();
              return;
            }
            if (e.data === PLAYING && !robotPlaying) notify?.(true);
            if (e.data === PAUSED && robotPlaying) notify?.(false);
          },
          onError: () => { if (!cancelled) setFailed(true); },
        },
      });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      host.replaceChildren();
    };
    // The player is created once; changes to the clip go through cueVideoById below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the clip when the choreography changes; the first one was loaded with the player.
  const cued = useRef(videoId);
  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player || cued.current === videoId) return;
    cued.current = videoId;
    player.cueVideoById({ videoId });
    applyRate(player);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player) return;
    if (playing) start(player);
    else player.pauseVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, playing]);

  useEffect(() => {
    if (ready && playerRef.current) applyRate(playerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, speed, rate]);

  // Rewind on Reset, but not when the player first becomes ready: a Play pressed while it
  // was still loading has to stand.
  const rewound = useRef(null);
  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player) return;
    if (rewound.current === null || rewound.current === resetKey) {
      rewound.current = resetKey;
      return;
    }
    rewound.current = resetKey;
    player.seekTo(0, true);
    player.pauseVideo();
  }, [ready, resetKey]);

  return (
    <figure className="fk-ref">
      <div className="fk-ref-frame">
        <div ref={mountRef} className="fk-ref-player" hidden={failed} />
        {failed && (
          <a className="fk-ref-fallback" href={shortsUrl(videoId)} target="_blank" rel="noreferrer">
            Watch the reference on YouTube
          </a>
        )}
      </div>
      <figcaption>
        Reference: <a href={shortsUrl(videoId)} target="_blank" rel="noreferrer">{title}</a>, {credit} on YouTube
        {clipRate !== null && <span className="fk-ref-rate"> · clip at {clipRate}×</span>}
      </figcaption>
    </figure>
  );
}
