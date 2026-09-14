import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { useToast } from '@/components/ui/ToastContext';
import { authService } from '@/services/api';

interface MobileRegisterPageProps {
  onNavigateToLogin: (registeredEmail?: string) => void;
  onNavigateToAuthorityLogin?: () => void;
  onNavigateToHome: () => void;
}

export const MobileRegisterPage: React.FC<MobileRegisterPageProps> = ({
  onNavigateToLogin,
  onNavigateToAuthorityLogin,
  onNavigateToHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization] = useState('Citizen Auditor / Public');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setErrorMessage('The passwords entered do not match.');
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

      setIsSubmitting(false);
      toast.success(
        'Registration Completed',
        `Account created for ${cleanName} with Public Auditor privileges.`
      );
      onNavigateToLogin(cleanEmail);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const apiErr = err as { message?: string };
      setErrorMessage(apiErr?.message || 'Registration failed. Please try again.');
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
              PUBLIC AUDITOR REGISTRATION
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0 0' }}>
              Create Visitor Account
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Register for read-only access to certified statutory reports and immutable audit records.
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
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Full Name</label>
              <input
                type="text"
                className="mobile-input"
                placeholder="Dr. Rajesh Gupta"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

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
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Password (Min. 6 chars)</label>
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

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="mobile-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="mobile-btn-touch mobile-btn-primary"
              disabled={isSubmitting}
              style={{ marginTop: 6 }}
            >
              {isSubmitting ? 'Registering...' : 'Register Account'} <ArrowRight size={15} />
            </button>
          </form>

          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center', paddingTop: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <span
                onClick={() => onNavigateToLogin(email)}
                style={{ color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </span>
            </div>

            {onNavigateToAuthorityLogin && (
              <button
                type="button"
                className="mobile-btn-touch mobile-btn-outline"
                onClick={onNavigateToAuthorityLogin}
                style={{ fontSize: 11, height: 38 }}
              >
                <ShieldCheck size={13} /> Official Authority / Officer Access
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
