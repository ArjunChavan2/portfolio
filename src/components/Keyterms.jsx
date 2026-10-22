// Renders **term** in a project summary as a bold key term; odd split pieces are the marked ones.
export default function Keyterms({ text }) {
  return text.split('**').map((s, i) => (i % 2 ? <strong key={i} className="kt">{s}</strong> : s));
}
