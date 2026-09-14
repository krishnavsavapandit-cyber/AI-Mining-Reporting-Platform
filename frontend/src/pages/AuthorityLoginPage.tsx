import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Key,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Briefcase,
  Cpu,
  UserCheck,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { UserRole } from '@/types';
import { authService } from '@/services/api';

interface AuthorityLoginPageProps {
  initialEmail?: string;
  onLoginSuccess: () => void;
  onNavigateToPublicLogin: () => void;
  onNavigateToHome: () => void;
}

interface KnownCredential {
  email: string;
  role: UserRole;
  name: string;
  title: string;
  level: number;
}

const KNOWN_AUTHORITIES: KnownCredential[] = [
  {
    email: 'analyst@cil.gov.in',
    role: 'ANALYST',
    name: 'Dr. Debashis Roy',
    title: 'Mining Intelligence Analyst',
    level: 2,
  },
  {
    email: 'officer@cil.gov.in',
    role: 'OFFICER',
    name: 'Smt. Ananya Sen, IAS',
    title: 'Reviewing Officer / Joint Secretary',
    level: 3,
  },
  {
    email: 'admin@cil.gov.in',
    role: 'ADMIN',
    name: 'Col. K. V. Sharma (Retd.)',
    title: 'Chief System Administrator',
    level: 4,
  },
];

export const AuthorityLoginPage: React.FC<AuthorityLoginPageProps> = ({
  initialEmail = '',
  onLoginSuccess,
  onNavigateToPublicLogin,
  onNavigateToHome,
}) => {
  const { login } = useAuth();
  const toast = useToast();

  const [emailOrUsername, setEmailOrUsername] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to pre-populate evaluator credentials
  const handleSelectQuickFill = (auth: KnownCredential) => {
    setEmailOrUsername(auth.email);
    setPassword('authority2026');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const input = emailOrUsername.trim().toLowerCase();
    if (!input) {
      setErrorMessage('Please enter your official CIL / CMPDI credentials.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your secure account password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Authenticate with the server-side authority login API
      const res = await authService.loginAuthority({ email: input, password });
      setIsSubmitting(false);

      if (res && res.user) {
        login(
          {
            email: res.user.email,
            name: res.user.name,
            accountType: res.user.accountType,
            authorizedRole: res.user.authorizedRole as UserRole,
          },
          res.token
        );

        toast.success(
          'Authority Session Verified',
          `Authenticated as ${res.user.name} (${res.user.title || res.user.authorizedRole}). Clearance Level ${res.user.level || 2} active.`
        );
        onLoginSuccess();
        return;
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const apiErr = err as { message?: string; status?: number };
      
      if (apiErr && (apiErr.status === 401 || apiErr.status === 400 || apiErr.status === 403)) {
        const msg = apiErr.message || 'Invalid official credentials or password.';
        setErrorMessage(msg);
        toast.error('Authority Authentication Failed', msg);
        return;
      }

      // Network / server connection error
      const fallbackMsg = apiErr?.message || 'Authentication service unreachable. Please ensure the backend server is running.';
      setErrorMessage(fallbackMsg);
      toast.error('Authentication Error', fallbackMsg);
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
              SIH26023 • Coal India Limited • Official Access
            </span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToPublicLogin}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(255,255,255,0.18)' }}
          >
            <span>Public Portal</span>
          </button>

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

      {/* Main Split-Screen Workspace */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px',
          gap: '36px',
          alignItems: 'center',
        }}
      >
        {/* Left Side: Cinematic Authority Intelligence Showcase */}
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
              url("/images/geological_core_drilling.jpg")
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Institutional Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                letterSpacing: '0.04em',
              }}
            >
              <ShieldCheck size={13} />
              <span>OFFICIAL CIL / CMPDI AUTHORITY GATEWAY</span>
            </div>
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
              Statutory Mining Governance & Operational Command
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#D1D5DB' }}>
              Secure operational entry for designated Mining Intelligence Analysts, Reviewing Officers (Joint Secretary level), and System Administrators across all 7 CIL subsidiaries.
            </p>
          </div>

          {/* Key Clearance Level Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                backgroundColor: 'rgba(11, 14, 20, 0.75)',
                border: '1px solid rgba(20, 184, 166, 0.25)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Briefcase size={16} style={{ color: 'var(--accent-teal)' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>Mining Intelligence Analysts</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Level 2 • Ingest statutory filings, run DAG workflows, author draft reports</div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                backgroundColor: 'rgba(11, 14, 20, 0.75)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <UserCheck size={16} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>Reviewing Officers / Joint Secretary</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Level 3 • Sign off on parliamentary inquiries, resolve discrepancy audits</div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                backgroundColor: 'rgba(11, 14, 20, 0.75)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Cpu size={16} style={{ color: 'var(--status-warning)' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>System Administrators</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Level 4 • Manage infrastructure, AI providers, database migrations & telemetry</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} style={{ color: 'var(--accent-primary)' }} />
            <span>Role clearance is strictly verified from official credentials upon authentication.</span>
          </div>
        </div>

        {/* Right Side: Authority Login Form */}
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
          {/* Header */}
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
                letterSpacing: '0.04em',
                marginBottom: 10,
              }}
            >
              <Lock size={11} /> RESTRICTED PERSONNEL ACCESS
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Official Authority Access
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Restricted access for authorized mining intelligence and governance personnel.
            </p>
          </div>

          {/* Evaluation Quick-Fill Helpers for Testers / Evaluators */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              DEMO EVALUATION CREDENTIALS (CLICK TO TEST):
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {KNOWN_AUTHORITIES.map((auth) => (
                <button
                  key={auth.role}
                  type="button"
                  onClick={() => handleSelectQuickFill(auth)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hairline-alt)',
                    backgroundColor: emailOrUsername === auth.email ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-3)',
                    color: emailOrUsername === auth.email ? 'var(--text-emerald)' : 'var(--text-primary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {auth.role === 'ANALYST' ? 'Mining Analyst' : auth.role === 'OFFICER' ? 'Reviewing Officer' : 'System Admin'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Error banner */}
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

            {/* Official Email / Username */}
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
                Official CIL Email or Username
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
                  type="text"
                  className="input"
                  required
                  placeholder="analyst@cil.gov.in"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  style={{ width: '100%', paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password */}
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
                Secure Password
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
                  placeholder="••••••••••••"
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
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <span>{isSubmitting ? 'Verifying Official Clearance...' : 'Authenticate Authority Session'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Footer Link to Public Portal */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid var(--border-hairline)',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            Need public or demonstration access instead?{' '}
            <button
              type="button"
              onClick={onNavigateToPublicLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Explore the Public Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityLoginPage;
