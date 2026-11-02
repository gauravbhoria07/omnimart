import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { api } from '../utils/api';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
  addToast: (message: string, type: 'success' | 'error') => void;
}

export default function AuthModal({ onClose, onSuccess, addToast }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.post('/auth/login', { email, password });
        addToast(`Welcome back, ${data.user.name}!`, 'success');
        onSuccess(data.user, data.access_token);
        onClose();
      } else {
        const data = await api.post('/auth/register', {
          email,
          password,
          name,
          role,
        });
        addToast(`Account created successfully! Hello ${data.user.name}.`, 'success');
        onSuccess(data.user, data.access_token);
        onClose();
      }
    } catch (err: any) {
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal" id="authentication-dialog">
        <button className="auth-close" onClick={onClose} aria-label="Close Authentication">
          <X size={20} />
        </button>

        <h3 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h3>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to access your cart, addresses, and orders.'
            : 'Register to start browsing and ordering products.'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name-input">Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#71717a',
                  }}
                />
                <input
                  id="name-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px', width: '100%' }}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email-input">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#71717a',
                }}
              />
              <input
                id="email-input"
                type="email"
                className="form-input"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password-input">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#71717a',
                }}
              />
              <input
                id="password-input"
                type="password"
                className="form-input"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Select Account Role</label>
              <div className="role-selector">
                <div
                  className={`role-option ${role === 'user' ? 'active' : ''}`}
                  onClick={() => setRole('user')}
                >
                  Customer Role
                </div>
                <div
                  className={`role-option ${role === 'admin' ? 'active' : ''}`}
                  onClick={() => setRole('admin')}
                >
                  Admin Role
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
}
