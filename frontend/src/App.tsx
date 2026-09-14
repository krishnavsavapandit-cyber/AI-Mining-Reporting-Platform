import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/ToastContext';
import { PublicLandingPage } from '@/pages/PublicLandingPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LoginPage } from '@/pages/LoginPage';
import { AuthorityLoginPage } from '@/pages/AuthorityLoginPage';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationTab } from '@/components/layout/Sidebar';
import { useIsMobile } from '@/utils/useIsMobile';
import { MobilePublicLandingPage } from '@/components/mobile/pages/MobilePublicLandingPage';
import { MobileRegisterPage } from '@/components/mobile/pages/MobileRegisterPage';
import { MobileLoginPage } from '@/components/mobile/pages/MobileLoginPage';
import { MobileAuthorityLoginPage } from '@/components/mobile/pages/MobileAuthorityLoginPage';
import { MobileAppShell } from '@/components/mobile/MobileAppShell';

export type AppView =
  | { type: 'landing' }
  | { type: 'register' }
  | { type: 'login'; registeredEmail?: string }
  | { type: 'authority'; registeredEmail?: string }
  | { type: 'dashboard'; tab: NavigationTab };

const parsePath = (): AppView => {
  if (typeof window === 'undefined') {
    return { type: 'landing' };
  }

  const path = window.location.pathname.toLowerCase().trim();

  if (path === '/register') {
    return { type: 'register' };
  }

  if (path === '/login') {
    return { type: 'login' };
  }

  if (path === '/authority' || path === '/authority/login' || path === '/authority-login') {
    return { type: 'authority' };
  }

  if (path === '/dashboard' || path === '/overview') {
    return { type: 'dashboard', tab: 'overview' };
  }

  const validTabs: NavigationTab[] = [
    'overview',
    'dashboard',
    'documents',
    'search',
    'assistant',
    'reports',
    'inquiries',
    'validation',
    'topics',
    'analytics',
    'agents',
    'audit',
    'settings',
    'help',
  ];

  const matchedTab = validTabs.find((t) => path === `/${t}`);
  if (matchedTab) {
    return { type: 'dashboard', tab: matchedTab };
  }

  // Root '/' defaults to Public Landing Page
  return { type: 'landing' };
};

export const MainRouter: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(parsePath);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(parsePath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string, view: AppView) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
    }
    setCurrentView(view);
  };

  // 1. Standalone Public Landing Page
  if (currentView.type === 'landing') {
    if (isMobile) {
      return (
        <MobilePublicLandingPage
          onExplorePlatform={() => {
            if (isAuthenticated || user) {
              navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
            } else {
              navigateTo('/register', { type: 'register' });
            }
          }}
          onRegister={() => {
            navigateTo('/register', { type: 'register' });
          }}
          onLogin={() => {
            navigateTo('/login', { type: 'login' });
          }}
          onAuthorityAccess={() => {
            navigateTo('/authority', { type: 'authority' });
          }}
        />
      );
    }
    return (
      <PublicLandingPage
        onExplorePlatform={() => {
          if (isAuthenticated || user) {
            navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
          } else {
            navigateTo('/register', { type: 'register' });
          }
        }}
        onRegister={() => {
          navigateTo('/register', { type: 'register' });
        }}
        onLogin={() => {
          navigateTo('/login', { type: 'login' });
        }}
        onAuthorityAccess={() => {
          navigateTo('/authority', { type: 'authority' });
        }}
      />
    );
  }

  // 2. Public Registration Page
  if (currentView.type === 'register') {
    if (isMobile) {
      return (
        <MobileRegisterPage
          onNavigateToLogin={(email) => {
            navigateTo('/login', { type: 'login', registeredEmail: email });
          }}
          onNavigateToAuthorityLogin={() => {
            navigateTo('/authority', { type: 'authority' });
          }}
          onNavigateToHome={() => {
            navigateTo('/', { type: 'landing' });
          }}
        />
      );
    }
    return (
      <RegisterPage
        onNavigateToLogin={(email) => {
          navigateTo('/login', { type: 'login', registeredEmail: email });
        }}
        onNavigateToAuthorityLogin={() => {
          navigateTo('/authority', { type: 'authority' });
        }}
        onNavigateToHome={() => {
          navigateTo('/', { type: 'landing' });
        }}
      />
    );
  }

  // 3. Public Login Page
  if (currentView.type === 'login') {
    if (isMobile) {
      return (
        <MobileLoginPage
          initialEmail={currentView.registeredEmail}
          onLoginSuccess={() => {
            navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
          }}
          onNavigateToRegister={() => {
            navigateTo('/register', { type: 'register' });
          }}
          onNavigateToAuthorityLogin={() => {
            navigateTo('/authority', { type: 'authority' });
          }}
          onNavigateToHome={() => {
            navigateTo('/', { type: 'landing' });
          }}
        />
      );
    }
    return (
      <LoginPage
        initialEmail={currentView.registeredEmail}
        onLoginSuccess={() => {
          navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
        }}
        onNavigateToRegister={() => {
          navigateTo('/register', { type: 'register' });
        }}
        onNavigateToAuthorityLogin={() => {
          navigateTo('/authority', { type: 'authority' });
        }}
        onNavigateToHome={() => {
          navigateTo('/', { type: 'landing' });
        }}
      />
    );
  }

  // 4. Official Authority Login Page
  if (currentView.type === 'authority') {
    if (isMobile) {
      return (
        <MobileAuthorityLoginPage
          initialEmail={currentView.registeredEmail}
          onLoginSuccess={() => {
            navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
          }}
          onNavigateToPublicLogin={() => {
            navigateTo('/login', { type: 'login' });
          }}
          onNavigateToHome={() => {
            navigateTo('/', { type: 'landing' });
          }}
        />
      );
    }
    return (
      <AuthorityLoginPage
        initialEmail={currentView.registeredEmail}
        onLoginSuccess={() => {
          navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
        }}
        onNavigateToPublicLogin={() => {
          navigateTo('/login', { type: 'login' });
        }}
        onNavigateToHome={() => {
          navigateTo('/', { type: 'landing' });
        }}
      />
    );
  }

  // 5. Protected Dashboard Access Control Guard:
  // If unauthenticated visitor attempts direct access to /dashboard, redirect to Login
  if (!isAuthenticated && !user) {
    if (isMobile) {
      return (
        <MobileLoginPage
          onLoginSuccess={() => {
            navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
          }}
          onNavigateToRegister={() => {
            navigateTo('/register', { type: 'register' });
          }}
          onNavigateToAuthorityLogin={() => {
            navigateTo('/authority', { type: 'authority' });
          }}
          onNavigateToHome={() => {
            navigateTo('/', { type: 'landing' });
          }}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={() => {
          navigateTo('/dashboard', { type: 'dashboard', tab: 'overview' });
        }}
        onNavigateToRegister={() => {
          navigateTo('/register', { type: 'register' });
        }}
        onNavigateToAuthorityLogin={() => {
          navigateTo('/authority', { type: 'authority' });
        }}
        onNavigateToHome={() => {
          navigateTo('/', { type: 'landing' });
        }}
      />
    );
  }

  // 6. Authenticated Operational Application
  if (isMobile) {
    return <MobileAppShell />;
  }
  return <AppShell />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainRouter />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
