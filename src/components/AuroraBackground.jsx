// Soft drifting aurora behind a section, in the spirit of React Bits' Aurora.
// CSS-only (blurred gradient blobs animated with transform), so it costs no
// JS or WebGL, follows the light/dark theme variables, and is switched off
// by prefers-reduced-motion. Decorative only.
export default function AuroraBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora-blob aurora-a" />
      <span className="aurora-blob aurora-b" />
      <span className="aurora-blob aurora-c" />
    </div>
  );
}
