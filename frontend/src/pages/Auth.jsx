import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      nav(location.state?.from || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <BrainCircuit size={30} />
          <span>documind</span>
        </div>

        <h1>{isLogin ? 'Welcome back' : 'Create your workspace'}</h1>
        <p className="muted">
          {isLogin ? 'Sign in to continue to your documents.' : 'Start asking smarter questions of your documents.'}
        </p>

        <form onSubmit={submit}>
          {!isLogin && (
            <label>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <button className="primary-btn full-btn" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create account' : 'Sign in'}</Link>
        </p>
      </div>
    </div>
  );
}

