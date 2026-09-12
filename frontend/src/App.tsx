import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/ToastContext';
import { AppShell } from '@/components/layout/AppShell';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
