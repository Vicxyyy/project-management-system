import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
      <p className="text-6xl font-bold text-neutral-200">404</p>
      <h2 className="text-2xl font-semibold text-neutral-900">Page not found</h2>
      <p className="text-neutral-500">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary mt-4">
        Go to Dashboard
      </Link>
    </div>
  );
}
