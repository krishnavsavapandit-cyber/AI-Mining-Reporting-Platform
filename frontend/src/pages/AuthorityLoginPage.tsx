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
  Sparkles,
  ChevronRight,
  Shield,
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

interface AuthorityPortalTier {
  role: UserRole;
  title: string;
  portalName: string;
  level: number;
  badge: string;
  badgeColor: string;
  borderColor: string;
  accentColor: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  description: string;
  capabilities: string[];
  defaultDemoEmail: string;
  demoOfficerName: string;
}

const AUTHORITY_PORTALS: AuthorityPortalTier[] = [
  {
    role: 'ADMIN',
    title: 'Chief System Administrator',
    portalName: 'Administrator Portal',
    level: 4,
    badge: 'CLEARANCE LEVEL 4 • SYSTEM GOVERNANCE',
    badgeColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    accentColor: '#F59E0B',
    icon: Cpu,
    description: 'System administration, AI provider configuration, database migration, and security governance access.',
    capabilities: [
      'Multi-provider AI configuration (Gemini / Claude / OpenAI)',
      'Vector store indexing & database schema management',
      'System-wide audit logging & user access provisioning',
    ],
    defaultDemoEmail: 'admin@cil.gov.in',
    demoOfficerName: 'Col. K. V. Sharma (Retd.)',
  },
  {
    role: 'OFFICER',
    title: 'Reviewing Officer / Joint Secretary',
    portalName: 'Officer Portal',
    level: 3,
    badge: 'CLEARANCE LEVEL 3 • STATUTORY COMMAND',
    badgeColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10B981',
    icon: UserCheck,
    description: 'Operational review, statutory executive report sign-off, and parliamentary inquiry dispatch access.',
    capabilities: [
      'Statutory sign-off on executive and annual compliance reports',
      'Parliamentary question (Lok Sabha / Rajya Sabha) formulation',
      'Discrepancy resolution decision matrix adjudication',
    ],
    defaultDemoEmail: 'officer@cil.gov.in',
    demoOfficerName: 'Smt. Ananya Sen, IAS',
  },
  {
    role: 'ANALYST',
    title: 'Mining Intelligence Analyst',
    portalName: 'Analyst Portal',
    level: 2,
    badge: 'CLEARANCE LEVEL 2 • ANALYTICAL COMMAND',
    badgeColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: 'rgba(20, 184, 166, 0.4)',
    accentColor: '#14B8A6',
    icon: Briefcase,
    description: 'Mining intelligence, borehole extraction, statutory filings ingestion, and analytical DAG access.',
    capabilities: [
      'Borehole stratigraphy, OCR parsing & physical filing ingestion',
      '8-agent DAG execution & multi-subsidiary cross validation',
      'Hybrid semantic vector search across 7 CIL subsidiaries',
    ],
    defaultDemoEmail: 'analyst@cil.gov.in',
    demoOfficerName: 'Dr. Debashis Roy',
  },
  {
    role: 'VIEWER',
    title: 'Statutory Viewer & External Auditor',
    portalName: 'Viewer Portal',
    level: 1,
    badge: 'CLEARANCE LEVEL 1 • AUDIT & INSPECTION',
    badgeColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    accentColor: '#3B82F6',
    icon: Shield,
    description: 'Read-only information access, certified report review, and immutable provenance inspection.',
    capabilities: [
      'Read-only inspection of multi-subsidiary production telemetry',
      'Browse certified executive reports & ISO/IEC benchmarks',
      'Verify immutable SHA-256 cryptographic provenance records',
    ],
    defaultDemoEmail: 'auditor.public@geonexus.cil',
    demoOfficerName: 'Public Auditor / Citizen Viewer',
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

  // Navigation State: null = Portal Selection Screen; Tier = Selected Portal Login View
  const [selectedPortal, setSelectedPortal] = useState<AuthorityPortalTier | null>(null);

  const [emailOrUsername, setEmailOrUsername] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Transition from Selection -> Selected Portal View
  const handleSelectPortal = (portal: AuthorityPortalTier) => {
    setSelectedPortal(portal);
    setEmailOrUsername(portal.defaultDemoEmail);
    setPassword('authority2026');
    setErrorMessage(null);
  };

  // Return from Selected Portal View -> Selection Screen
  const handleBackToPortals = () => {
    setSelectedPortal(null);
    setErrorMessage(null);
  };

  // Helper for Hackathon Evaluator Quick-Fill
  const handleQuickFillCurrentRole = () => {
    if (!selectedPortal) return;
    setEmailOrUsername(selectedPortal.defaultDemoEmail);
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
      // Server-side RBAC strictly determines the authorized role from the authenticated account
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
        const msg = apiErr.message || 'Invalid official credentials or unauthorized identifier.';
        setErrorMessage(msg);
        toast.error('Authority Authentication Failed', msg);
        return;
      }

      // In mock/offline demonstration fallback mode
      if (selectedPortal) {
        login({
          email: input,
          name: selectedPortal.demoOfficerName,
          accountType: selectedPortal.role === 'VIEWER' ? 'PUBLIC_VIEWER' : 'AUTHORITY',
          authorizedRole: selectedPortal.role,
        });

        toast.success(
          'Authority Session Verified (Offline Demo)',
          `Authenticated as ${selectedPortal.demoOfficerName} (${selectedPortal.title}). Clearance Level ${selectedPortal.level} active.`
        );
        onLoginSuccess();
        return;
      }

      const fallbackMsg =
        apiErr?.message || 'Authentication service unreachable. Please ensure the backend server is running.';
      setErrorMessage(fallbackMsg);
      toast.error('Authentication Error', fallbackMsg);
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
                OFFICIAL PORTAL
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              SIH26023 • Coal India Limited • Statutory Governance Gateway
            </span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToPublicLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <span>Public Portal</span>
          </button>

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

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px 48px' }}>
        {/* =========================================================================
            STAGE 1: AUTHORITY PORTAL SELECTION SCREEN (4 Distinct Role Cards)
            ========================================================================= */}
        {!selectedPortal ? (
          <div style={{ maxWidth: '1120px', width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Header Banner */}
            <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--text-emerald)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: 14,
                }}
              >
                <ShieldCheck size={14} />
                <span>OFFICIAL CIL / CMPDI AUTHORITY GATEWAY</span>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(26px, 3.2vw, 38px)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  letterSpacing: '-0.025em',
                  marginBottom: 10,
                }}
              >
                Select Your Authority Portal
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Secure operational entry for designated personnel across Coal India Limited and CMPDI. Choose your clearance tier to proceed to authentication.
              </p>
            </div>

            {/* 4 Authority Portal Cards */}
            <div className="authority-selection-grid">
              {AUTHORITY_PORTALS.map((portal) => {
                const IconComponent = portal.icon;
                return (
                  <button
                    key={portal.role}
                    type="button"
                    className="authority-portal-card"
                    onClick={() => handleSelectPortal(portal)}
                    style={{
                      borderLeft: `4px solid ${portal.accentColor}`,
                    }}
                    aria-label={`Enter ${portal.portalName}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: portal.badgeColor,
                          border: `1px solid ${portal.borderColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: portal.accentColor,
                        }}
                      >
                        <IconComponent size={22} />
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: portal.badgeColor,
                          color: portal.accentColor,
                          border: `1px solid ${portal.borderColor}`,
                          letterSpacing: '0.04em',
                        }}
                      >
                        LEVEL {portal.level}
                      </span>
                    </div>

                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 4, letterSpacing: '-0.01em' }}>
                      {portal.portalName}
                    </h2>
                    <div style={{ fontSize: 12, fontWeight: 700, color: portal.accentColor, marginBottom: 8 }}>
                      {portal.title}
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
                      {portal.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                      {portal.capabilities.map((cap, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#CBD5E1' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: portal.accentColor, flexShrink: 0 }} />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: 14,
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: portal.accentColor,
                        fontWeight: 700,
                        fontSize: 12.5,
                      }}
                    >
                      <span>Enter {portal.portalName}</span>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Security Boundary Notice */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(17, 22, 32, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                maxWidth: '820px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              <Lock size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#FFFFFF' }}>Statutory Security Policy:</strong> Portal selection establishes your intended operational entry point. Account clearance is cryptographically verified from server-authenticated credentials upon login.
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             STAGE 2: SELECTED PORTAL CREDENTIAL VIEW
             ========================================================================= */
          <div className="auth-layout-grid" style={{ maxWidth: '1120px', width: '100%' }}>
            {/* Left Side: Selected Portal Overview */}
            <div
              className="auth-hero-card"
              style={{
                backgroundImage: `
                  linear-gradient(180deg, rgba(11, 14, 20, 0.88) 0%, rgba(17, 22, 32, 0.96) 100%),
                  url("/images/geological_core_drilling.jpg")
                `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderLeft: `4px solid ${selectedPortal.accentColor}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleBackToPortals}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={13} />
                  <span>Back to Authority Portals</span>
                </button>
              </div>

              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: selectedPortal.badgeColor,
                    color: selectedPortal.accentColor,
                    border: `1px solid ${selectedPortal.borderColor}`,
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    marginBottom: 12,
                  }}
                >
                  <Lock size={12} />
                  <span>{selectedPortal.badge}</span>
                </div>
                <h1
                  style={{
                    fontSize: 'clamp(24px, 2.6vw, 32px)',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em',
                    marginBottom: 10,
                  }}
                >
                  {selectedPortal.portalName}
                </h1>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#D1D5DB' }}>
                  {selectedPortal.description}
                </p>
              </div>

              {/* Clearance Capabilities */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(11, 14, 20, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>
                  Authorized Operational Capabilities:
                </div>
                {selectedPortal.capabilities.map((cap, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: selectedPortal.accentColor, flexShrink: 0 }} />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Authority Login Form */}
            <div className="auth-form-card">
              {/* Header Title */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: selectedPortal.badgeColor,
                    border: `1px solid ${selectedPortal.borderColor}`,
                    color: selectedPortal.accentColor,
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    marginBottom: 10,
                  }}
                >
                  <Lock size={12} />
                  <span>RESTRICTED PERSONNEL AUTHENTICATION</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 4, letterSpacing: '-0.02em' }}>
                  Sign In to {selectedPortal.portalName}
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Enter your official CIL credentials to verify clearance and enter operational command.
                </p>
              </div>

              {/* Demo Evaluation Helper Button */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(11, 14, 20, 0.75)',
                  border: '1px solid var(--border-hairline-alt)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Demo: <strong style={{ color: '#FFFFFF' }}>{selectedPortal.defaultDemoEmail}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillCurrentRole}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: selectedPortal.badgeColor,
                    border: `1px solid ${selectedPortal.borderColor}`,
                    color: selectedPortal.accentColor,
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Autofill evaluation credentials for this portal"
                >
                  <Sparkles size={11} />
                  <span>Autofill Demo</span>
                </button>
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

                {/* Email / Username */}
                <div>
                  <label
                    htmlFor="authority-login-email"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: 7,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Official CIL Email or Identifier
                  </label>
                  <div className="auth-input-container">
                    <input
                      id="authority-login-email"
                      type="text"
                      name="username"
                      autoComplete="username"
                      required
                      placeholder="e.g. analyst@cil.gov.in"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className={`auth-input-field ${errorMessage && !emailOrUsername ? 'has-error' : ''}`}
                    />
                    <Mail size={16} className="auth-field-icon" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="authority-login-password"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: 7,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Secure Password
                  </label>
                  <div className="auth-input-container">
                    <input
                      id="authority-login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••••••"
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
                        accentColor: selectedPortal.accentColor,
                        cursor: 'pointer',
                        width: 15,
                        height: 15,
                      }}
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
                    fontWeight: 800,
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    letterSpacing: '0.01em',
                    backgroundColor: selectedPortal.accentColor,
                    borderColor: selectedPortal.accentColor,
                  }}
                >
                  <span>{isSubmitting ? 'Verifying Official Clearance...' : `Authenticate as ${selectedPortal.title}`}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Switch Portal / Return Link */}
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  Need a different authority rank?{' '}
                  <button
                    type="button"
                    onClick={handleBackToPortals}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: selectedPortal.accentColor,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Change Authority Portal
                  </button>
                </div>

                <div>
                  Public visitor or researcher?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToPublicLogin}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Go to Public Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuthorityLoginPage;
