import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { useToast } from '@/components/ui/ToastContext';
import { authService } from '@/services/api';

interface RegisterPageProps {
  onNavigateToLogin: (registeredEmail?: string) => void;
  onNavigateToAuthorityLogin?: () => void;
  onNavigateToHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onNavigateToAuthorityLogin,
  onNavigateToHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const organization = 'Citizen Auditor / Public';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('The passwords entered do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.registerPublic({
        email: cleanEmail,
        fullName: cleanName,
        organization: organization.trim(),
        password,
      });

      // Save registered user info locally for public demonstration session
      try {
        const publicUsers = JSON.parse(localStorage.getItem('geonexus_public_users') || '[]');
        publicUsers.push({
          fullName: cleanName,
          email: cleanEmail,
          accountType: 'PUBLIC_VIEWER',
          role: 'VIEWER',
          registeredAt: new Date().toISOString(),
        });
        localStorage.setItem('geonexus_public_users', JSON.stringify(publicUsers));
      } catch {
        // Ignored
      }

      setIsSubmitting(false);
      toast.success(
        'Registration Completed',
        `Account created for ${cleanName} with Public Auditor & Viewer privileges.`
      );
      onNavigateToLogin(cleanEmail);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const apiErr = err as { message?: string; status?: number };
      const msg = apiErr?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toast.error('Registration Error', msg);
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
                REGISTRATION
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              SIH26023 • Coal India Limited • Public Registration
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
        {/* Left Side: Intelligence & Transparency Overview */}
        <div
          className="auth-hero-card"
          style={{
            backgroundImage: `
              linear-gradient(180deg, rgba(11, 14, 20, 0.88) 0%, rgba(17, 22, 32, 0.96) 100%),
              url("/images/dragline_excavator.jpg")
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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
            <Sparkles size={14} />
            <span>RESEARCHER & CITIZEN AUDITOR ACCESS</span>
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
              Verify Mining Truth & Provenance
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#D1D5DB' }}>
              Register for public demonstration access to explore automated document intelligence, cross-validation metrics, and multi-agent reporting models.
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
              <ShieldCheck size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>Public Account Entitlements</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Full read-only inspection of multi-subsidiary mining metrics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Browse certified reports & ISO/IEC 25010 benchmark evaluations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Inspect immutable SHA-256 hash provenance audit records</span>
            </div>
          </div>
        </div>

        {/* Right Side: Public Registration Form */}
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
              <Sparkles size={12} />
              <span>PUBLIC ACCOUNT CREATION</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.02em' }}>
              Register for GeoNexus Access
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Create your public auditor account to inspect multi-agent workflows and telemetry.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
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

            {/* Full Name */}
            <div>
              <label
                htmlFor="register-fullname"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 7,
                  letterSpacing: '0.02em',
                }}
              >
                Full Name
              </label>
              <div className="auth-input-container">
                <input
                  id="register-fullname"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`auth-input-field ${errorMessage && !fullName ? 'has-error' : ''}`}
                />
                <User size={16} className="auth-field-icon" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 7,
                  letterSpacing: '0.02em',
                }}
              >
                Email Address
              </label>
              <div className="auth-input-container">
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="rajesh.kumar@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`auth-input-field ${errorMessage && !email ? 'has-error' : ''}`}
                />
                <Mail size={16} className="auth-field-icon" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 7,
                  letterSpacing: '0.02em',
                }}
              >
                Password (min. 6 characters)
              </label>
              <div className="auth-input-container">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`auth-input-field ${errorMessage && !password ? 'has-error' : ''}`}
                  style={{ paddingRight: 42 }}
                />
                <Lock size={16} className="auth-field-icon" />
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 7,
                  letterSpacing: '0.02em',
                }}
              >
                Confirm Password
              </label>
              <div className="auth-input-container">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`auth-input-field ${errorMessage && password !== confirmPassword ? 'has-error' : ''}`}
                  style={{ paddingRight: 42 }}
                />
                <Lock size={16} className="auth-field-icon" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="auth-toggle-visibility-btn"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Privilege Notice */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(11, 14, 20, 0.65)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <ShieldCheck size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Public registered accounts are assigned <strong style={{ color: 'var(--text-primary)' }}>Auditor / Viewer</strong> read-only privileges. Official authority credentials for Analyst, Officer, or Admin operations require provisioned CIL/CMPDI verification.
              </div>
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
              <span>{isSubmitting ? 'Creating Account...' : 'Complete Public Registration'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Navigation Links */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigateToLogin(email)}
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
                Sign In to Public Portal
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

export default RegisterPage;
