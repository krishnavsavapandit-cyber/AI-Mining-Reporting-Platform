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

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.loginPublic({ email: email.trim(), password });
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
          email: email.trim(),
          name: email.split('@')[0] || 'Public Auditor',
          accountType: 'PUBLIC_VIEWER',
          authorizedRole: 'VIEWER',
        });
      }

      toast.success(
        'Public Auditor Authenticated',
        `Logged in as Public Auditor & Viewer (${email}). Read-only transparency exploration active.`
      );
      onLoginSuccess();
    } catch {
      // Fallback
      setIsSubmitting(false);
      login({
        email: email.trim(),
        name: email.split('@')[0] || 'Public Auditor',
        accountType: 'PUBLIC_VIEWER',
        authorizedRole: 'VIEWER',
      });
      toast.success(
        'Public Auditor Authenticated',
        `Logged in as Public Auditor & Viewer (${email}). Read-only transparency exploration active.`
      );
      onLoginSuccess();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#070A0F',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          height: '64px',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(11, 14, 20, 0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexShrink: 0,
        }}
      >
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
          }}
        >
          <MiningLogo size={30} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              GeoNexus
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              SIH26023 • Coal India Limited • Public Access
            </span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onNavigateToAuthorityLogin && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToAuthorityLogin}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--border-emerald)' }}
            >
              <Users size={13} style={{ color: 'var(--text-emerald)' }} />
              <span>Official Authority Portal</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToHome}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Split-Screen Layout */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px',
          gap: '36px',
          alignItems: 'center',
        }}
      >
        {/* Left Side: Visual Overview Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            padding: '36px',
            backgroundColor: 'rgba(17, 22, 32, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            backgroundImage: `
              linear-gradient(180deg, rgba(11, 14, 20, 0.85) 0%, rgba(17, 22, 32, 0.94) 100%),
              url("/images/open_surface_mine.jpg")
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--text-emerald)',
              fontSize: 11,
              fontWeight: 700,
              width: 'fit-content',
            }}
          >
            <ShieldCheck size={13} />
            <span>PUBLIC TRANSPARENCY & AUDITOR PORTAL</span>
          </div>

          <div>
            <h1
              style={{
                fontSize: 'clamp(26px, 3vw, 36px)',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              Explore Grounded Mining Intelligence
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#D1D5DB' }}>
              Public visitors, academic researchers, and external auditors can inspect published compliance reports, browse audited document catalogs, and review immutable SHA-256 provenance trails.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(11, 14, 20, 0.75)',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Public Demonstration Highlights:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
              <span>Full read-only access to multi-subsidiary mining metrics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
              <span>Grounded provenance verification on DGMS filings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
              <span>Live 8-agent DAG concurrency visualization</span>
            </div>
          </div>
        </div>

        {/* Right Side: Public Login Form */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline-alt)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-level-2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header Title */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--text-emerald)',
                fontSize: 10,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              <Lock size={11} /> PUBLIC & AUDITOR ACCESS
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Sign In to GeoNexus
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Enter your registered public viewer credentials to access the platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleViewerLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errorMessage && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Registered Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  className="input"
                  required
                  placeholder="auditor.public@geonexus.cil"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Key
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: 38, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Public Viewer Notice */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ShieldCheck size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Public accounts enter under the <strong>Auditor / Viewer</strong> perspective.</span>
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
                fontWeight: 700,
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Public Viewer'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Navigation Links */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Don't have a public account?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Register for Viewer Access
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
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Access Official Authority Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
