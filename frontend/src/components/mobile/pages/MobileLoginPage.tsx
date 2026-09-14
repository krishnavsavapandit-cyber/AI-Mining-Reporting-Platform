import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { authService } from '@/services/api';

interface MobileLoginPageProps {
  initialEmail?: string;
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToAuthorityLogin?: () => void;
  onNavigateToHome: () => void;
}

export const MobileLoginPage: React.FC<MobileLoginPageProps> = ({
  initialEmail = '',
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToAuthorityLogin,
  onNavigateToHome,
}) => {
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(initialEmail || 'auditor.public@geonexus.cil');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.loginPublic({ email: cleanEmail, password });
      setIsSubmitting(false);

      if (res && res.user) {
        login(
          {
            email: res.user.email,
            name: res.user.name,
            accountType: 'PUBLIC_VIEWER',
            authorizedRole: 'VIEWER',
          },
          res.token
        );
      } else {
        login({
          email: cleanEmail,
          name: cleanEmail.split('@')[0] || 'Public Auditor',
          accountType: 'PUBLIC_VIEWER',
          authorizedRole: 'VIEWER',
        });
      }

      toast.success('Authenticated', 'Logged in as Public Auditor (Read-Only).');
      onLoginSuccess();
    } catch {
      setIsSubmitting(false);
      login({
        email: cleanEmail,
        name: cleanEmail.split('@')[0] || 'Public Auditor',
        accountType: 'PUBLIC_VIEWER',
        authorizedRole: 'VIEWER',
      });
      toast.success('Authenticated', 'Logged in as Public Auditor.');
      onLoginSuccess();
    }
  };

  return (
    <div className="mobile-app-root">
      <header className="mobile-topbar">
        <button
          type="button"
          onClick={onNavigateToHome}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: 6, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ArrowLeft size={16} /> Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MiningLogo size={20} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>GeoNexus</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <main className="mobile-main-viewport">
        <div className="mobile-card" style={{ gap: 14, padding: '20px 16px' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '0.06em' }}>
              PUBLIC TRANSPARENCY PORTAL
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0 0' }}>
              Sign In to GeoNexus
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Access certified statutory reports, verified production figures, and immutable audit logs.
            </p>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 6,
                color: '#EF4444',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertCircle size={14} /> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Email Address</label>
              <input
                type="email"
                className="mobile-input"
                placeholder="name@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="mobile-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 13,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mobile-btn-touch mobile-btn-primary"
              disabled={isSubmitting}
              style={{ marginTop: 6 }}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In as Auditor'} <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Preset */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-2)',
              borderRadius: 6,
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => {
              setEmail('auditor.public@geonexus.cil');
              setPassword('demo123');
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Quick Fill: <strong style={{ color: 'var(--accent-primary)' }}>Public Auditor Demo</strong>
            </div>
            <Sparkles size={13} style={{ color: 'var(--accent-primary)' }} />
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center', paddingTop: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <span
                onClick={onNavigateToRegister}
                style={{ color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Register Now
              </span>
            </div>

            {onNavigateToAuthorityLogin && (
              <button
                type="button"
                className="mobile-btn-touch mobile-btn-outline"
                onClick={onNavigateToAuthorityLogin}
                style={{ fontSize: 11, height: 38 }}
              >
                <ShieldCheck size={13} /> Official Authority / Officer Login
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
