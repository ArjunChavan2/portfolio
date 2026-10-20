import { useEffect, useRef, useState } from 'react';

// Word-by-word blur/fade/rise reveal, in the style of React Bits' BlurText.
// Pure CSS transitions + IntersectionObserver, so there are no extra dependencies.
// The text stays a plain prop, so it keeps flowing from resume data and stays
// readable to screen readers (aria-label on the wrapper, spans hidden).
export default function BlurText({ text, as: Tag = 'span', stagger = 55, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(' ');
  return (
    <Tag ref={ref} className={`blur-text ${shown ? 'is-in' : ''} ${className}`.trim()} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="blur-word" aria-hidden="true" style={{ transitionDelay: `${i * stagger}ms` }}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
