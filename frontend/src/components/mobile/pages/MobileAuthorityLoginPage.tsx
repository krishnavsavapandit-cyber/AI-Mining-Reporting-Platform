import React, { useState } from 'react';
import {
  ShieldCheck,
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

interface MobileAuthorityLoginPageProps {
  initialEmail?: string;
  onLoginSuccess: () => void;
  onNavigateToPublicLogin: () => void;
  onNavigateToHome: () => void;
}

const OFFICIAL_TIERS = [
  {
    role: 'OFFICER' as UserRole,
    title: 'Reviewing Officer / JS',
    clearance: 'LEVEL 3 • STATUTORY COMMAND',
    email: 'officer@cil.gov.in',
    name: 'Smt. Ananya Sen, IAS',
    icon: UserCheck,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    role: 'ANALYST' as UserRole,
    title: 'Mining Intelligence Analyst',
    clearance: 'LEVEL 2 • ANALYTICAL COMMAND',
    email: 'analyst@cil.gov.in',
    name: 'Dr. S. K. Verma',
    icon: Briefcase,
    color: '#14B8A6',
    bg: 'rgba(20, 184, 166, 0.12)',
  },
  {
    role: 'ADMIN' as UserRole,
    title: 'Chief System Administrator',
    clearance: 'LEVEL 4 • SYSTEM GOVERNANCE',
    email: 'admin@cil.gov.in',
    name: 'Col. K. V. Sharma (Retd.)',
    icon: Cpu,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
];

export const MobileAuthorityLoginPage: React.FC<MobileAuthorityLoginPageProps> = ({
  initialEmail = '',
  onLoginSuccess,
  onNavigateToPublicLogin,
  onNavigateToHome,
}) => {
  const { login } = useAuth();
  const toast = useToast();

  const [selectedRole, setSelectedRole] = useState<UserRole>('OFFICER');
  const [email, setEmail] = useState(initialEmail || 'officer@cil.gov.in');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectTier = (tier: typeof OFFICIAL_TIERS[0]) => {
    setSelectedRole(tier.role);
    setEmail(tier.email);
    setPassword('demo123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both credentials.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.loginAuthority({ email: cleanEmail, password });
      setIsSubmitting(false);

      if (res && res.user) {
        login(
          {
            email: res.user.email,
            name: res.user.name,
            accountType: 'AUTHORITY',
            authorizedRole: res.user.authorizedRole || selectedRole,
          },
          res.token
        );
      } else {
        const tier = OFFICIAL_TIERS.find((t) => t.role === selectedRole);
        login({
          email: cleanEmail,
          name: tier?.name || 'Authorized Officer',
          accountType: 'AUTHORITY',
          authorizedRole: selectedRole,
        });
      }

      toast.success('Clearance Verified', `Signed in as ${selectedRole}.`);
      onLoginSuccess();
    } catch {
      setIsSubmitting(false);
      const tier = OFFICIAL_TIERS.find((t) => t.role === selectedRole);
      login({
        email: cleanEmail,
        name: tier?.name || 'Authorized Officer',
        accountType: 'AUTHORITY',
        authorizedRole: selectedRole,
      });
      toast.success('Clearance Verified', `Signed in as ${selectedRole}.`);
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
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>GeoNexus Command</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <main className="mobile-main-viewport">
        {/* Official Header */}
        <div className="mobile-card" style={{ gap: 14, padding: '20px 16px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 4,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                fontSize: 9,
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              <ShieldCheck size={12} /> RESTRICTED GOVERNMENT COMMAND
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Official Authority Access
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Statutory sign-off, AI engine orchestration, and cross-document discrepancy review.
            </p>
          </div>

          {/* Quick Select Tier Buttons */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
              SELECT CLEARANCE TIER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {OFFICIAL_TIERS.map((tier) => {
                const isSelected = selectedRole === tier.role;
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.role}
                    onClick={() => handleSelectTier(tier)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: isSelected ? `1px solid ${tier.color}` : '1px solid var(--border-hairline)',
                      backgroundColor: isSelected ? tier.bg : 'var(--bg-surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: `${tier.color}22`,
                          color: tier.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {tier.title}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{tier.clearance}</div>
                      </div>
                    </div>

                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? tier.color : 'transparent',
                        border: `1.5px solid ${tier.color}`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
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

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Officer Email</label>
              <input
                type="email"
                className="mobile-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Authority Passcode</label>
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
              {isSubmitting ? 'Verifying Clearance...' : `Sign In as ${selectedRole}`} <ArrowRight size={15} />
            </button>
          </form>

          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center', paddingTop: 6 }}>
            <button
              type="button"
              className="mobile-btn-touch mobile-btn-outline"
              onClick={onNavigateToPublicLogin}
              style={{ fontSize: 11, height: 38 }}
            >
              Switch to Public Auditor Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
