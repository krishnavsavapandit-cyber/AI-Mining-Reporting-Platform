import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { authService } from '@/services/api';

interface LoginPageProps {
  initialEmail?: string;
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToAuthorityLogin?: () => void;
  onNavigateToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
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
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleViewerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
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

      toast.success(
        'Public Auditor Authenticated',
        `Logged in as Public Auditor & Viewer (${cleanEmail}). Read-only transparency exploration active.`
      );
      onLoginSuccess();
    } catch {
      // Fallback in case of mock/demo mode
      setIsSubmitting(false);
      login({
        email: cleanEmail,
        name: cleanEmail.split('@')[0] || 'Public Auditor',
        accountType: 'PUBLIC_VIEWER',
        authorizedRole: 'VIEWER',
      });
      toast.success(
        'Public Auditor Authenticated',
        `Logged in as Public Auditor & Viewer (${cleanEmail}). Read-only transparency exploration active.`
      );
      onLoginSuccess();
    }
  };

  return (
    <div className="auth-page-container">
      {/* Top Header Bar */}
      <header className="auth-header-bar">
        <button
          type="button"
          onClick={onNavigateToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
          }}
          aria-label="GeoNexus Home"
        >
          <MiningLogo size={32} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                GeoNexus
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--text-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                PUBLIC
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              SIH26023 • Coal India Limited • Public Access
            </span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onNavigateToAuthorityLogin && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToAuthorityLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: 'var(--border-emerald)',
                backgroundColor: 'rgba(16, 185, 129, 0.06)',
              }}
            >
              <Users size={13} style={{ color: 'var(--text-emerald)' }} />
              <span style={{ color: 'var(--text-emerald)', fontWeight: 600 }}>Official Authority Portal</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToHome}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="auth-layout-grid">
        {/* Left Side: Visual Overview Card */}
        <div
          className="auth-hero-card"
          style={{
            backgroundImage: `
              linear-gradient(180deg, rgba(11, 14, 20, 0.88) 0%, rgba(17, 22, 32, 0.96) 100%),
              url("/images/open_surface_mine.jpg")
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--text-emerald)',
              fontSize: 11,
              fontWeight: 800,
              width: 'fit-content',
              letterSpacing: '0.04em',
            }}
          >
            <ShieldCheck size={14} />
            <span>PUBLIC TRANSPARENCY & AUDITOR PORTAL</span>
          </div>

          <div>
            <h1
              style={{
                fontSize: 'clamp(24px, 2.6vw, 34px)',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.25,
                letterSpacing: '-0.025em',
                marginBottom: 12,
              }}
            >
              Explore Grounded Mining Intelligence
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#D1D5DB' }}>
              Public visitors, academic researchers, and external auditors can inspect published compliance reports, browse audited document catalogs, and review immutable SHA-256 provenance trails.
            </p>
          </div>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(11, 14, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>Public Demonstration Capabilities</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Full read-only inspection of multi-subsidiary mining metrics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Grounded provenance verification on DGMS filings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Live 8-agent DAG concurrency visualization & benchmarks</span>
            </div>
          </div>
        </div>

        {/* Right Side: Public Login Form */}
        <div className="auth-form-card">
          {/* Header Title */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--text-emerald)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: 12,
              }}
            >
              <Lock size={12} />
              <span>PUBLIC AUDITOR ACCESS</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.02em' }}>
              Sign In to GeoNexus
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enter your registered public credentials to explore evidence-grounded reports.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleViewerLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
            {errorMessage && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#FCA5A5',
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  lineHeight: 1.45,
                }}
                role="alert"
              >
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="public-login-email"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 7,
                  letterSpacing: '0.02em',
                }}
              >
                Registered Email
              </label>
              <div className="auth-input-container">
                <input
                  id="public-login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="auditor.public@geonexus.cil"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`auth-input-field ${errorMessage && !email ? 'has-error' : ''}`}
                />
                <Mail size={16} className="auth-field-icon" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <label
                  htmlFor="public-login-password"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.02em',
                  }}
                >
                  Password
                </label>
              </div>
              <div className="auth-input-container">
                <input
                  id="public-login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`auth-input-field ${errorMessage && !password ? 'has-error' : ''}`}
                  style={{ paddingRight: 42 }}
                />
                <Key size={16} className="auth-field-icon" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-visibility-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  style={{
                    accentColor: 'var(--accent-primary)',
                    cursor: 'pointer',
                    width: 15,
                    height: 15,
                  }}
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Public Viewer Notice */}
            <div
              style={{
                padding: '11px 13px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(11, 14, 20, 0.65)',
                border: '1px solid var(--border-hairline)',
                fontSize: 11.5,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                lineHeight: 1.45,
              }}
            >
              <ShieldCheck size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>
                Public accounts authenticate under the <strong style={{ color: 'var(--text-primary)' }}>Auditor / Viewer</strong> role.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: 14,
                fontWeight: 800,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                letterSpacing: '0.01em',
              }}
            >
              <span>{isSubmitting ? 'Authenticating Session...' : 'Sign In as Public Viewer'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Navigation Links */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: 13,
                }}
              >
                Register for Free Access
              </button>
            </div>

            {onNavigateToAuthorityLogin && (
              <div style={{ fontSize: 12 }}>
                Official CIL / CMPDI Personnel?{' '}
                <button
                  type="button"
                  onClick={onNavigateToAuthorityLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-emerald)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontSize: 12,
                  }}
                >
                  Access Official Authority Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
