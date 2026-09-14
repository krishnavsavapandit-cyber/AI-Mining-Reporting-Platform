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

    if (!fullName.trim() || !email.trim() || !password) {
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
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        organization: organization.trim(),
        password,
      });

      // Save registered user info locally for public demonstration session
      try {
        const publicUsers = JSON.parse(localStorage.getItem('geonexus_public_users') || '[]');
        publicUsers.push({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
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
        `Account created for ${fullName.trim()} with Public Auditor & Viewer privileges.`
      );
      onNavigateToLogin(email.trim().toLowerCase());
    } catch (err: unknown) {
      setIsSubmitting(false);
      const apiErr = err as { message?: string; status?: number };
      const msg = apiErr?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toast.error('Registration Error', msg);
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
              SIH26023 • Coal India Limited • Public Registration
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
        {/* Left Side: Intelligence & Transparency Overview */}
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
              url("/images/dragline_excavator.jpg")
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
            <Sparkles size={13} />
            <span>OPEN RESEARCHER & CITIZEN AUDITOR ACCESS</span>
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
              Verify Mining Truth & Provenance
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#D1D5DB' }}>
              Register for public demonstration access to explore automated document intelligence, cross-validation metrics, and multi-agent reporting models.
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
              Public Account Permissions:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Full read-only inspection of multi-subsidiary mining metrics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Browse certified reports & ISO/IEC 25010 benchmark evaluations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Inspect immutable SHA-256 hash provenance audit records</span>
            </div>
          </div>
        </div>

        {/* Right Side: Public Registration Form */}
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
              <Sparkles size={11} /> PUBLIC VISITOR REGISTRATION
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Register for GeoNexus Access
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Create your public auditor account to inspect multi-agent workflows and telemetry.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

            {/* Full Name */}
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
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User
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
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Email */}
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
                Email Address
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
                  placeholder="rajesh.kumar@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
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

            {/* Confirm Password */}
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
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: 38, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Privilege Notice */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <ShieldCheck size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Public registered accounts are assigned <strong>Auditor / Viewer</strong> read-only privileges. Official authority credentials for Analyst, Officer, or Admin operations require provisioned CIL/CMPDI verification.
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
                fontWeight: 700,
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration'}</span>
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
              Already registered?{' '}
              <button
                type="button"
                onClick={() => onNavigateToLogin(email)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
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

export default RegisterPage;
