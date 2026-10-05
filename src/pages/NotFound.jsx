import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section page-top">
      <div className="container narrow">
        <p className="kicker">404</p>
        <h1>Page not found</h1>
        <p className="lede">That page doesn't exist. It may have moved.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </section>
  );
}
