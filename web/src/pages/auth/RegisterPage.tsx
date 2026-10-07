import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post<any>('/auth/register', { fullName, email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 text-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-3xl -z-10" />
      <div className="max-w-md w-full animate-fade-in">
        <div className="card text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Create Account</h2>
          <p className="text-slate-400 mb-8">Start managing your projects today</p>

          {error && <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded-xl mb-6 text-sm text-left">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5 text-left relative z-10">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Must be at least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">Requires uppercase, lowercase, number, and special character.</p>
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
