import React, { useState } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ReporterDashboard } from './components/reporter/ReporterDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { HospitalDashboard } from './components/hospital/HospitalDashboard';
import { AuthPage, AuthSession } from './components/auth/AuthPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { clearSession, restoreSession } from './components/auth/authStorage';

const initialTabForRole = (role: AuthSession['role']): NavTab => role;

function AppContent({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<NavTab>(initialTabForRole(session.role));

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 antialiased font-sans">
      <Sidebar
        activeTab={activeTab}
        role={session.role}
        userName={session.name}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          role={session.role}
          userName={session.name}
          onLogout={onLogout}
          onOpenProfile={() => setActiveTab('profile')}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'profile' && <ProfilePage session={session} />}
          {session.role === 'reporter' && activeTab === 'reporter' && (
            <ReporterDashboard callerId={session.id} callerName={session.name} callerPhone={session.phone} />
          )}
          {session.role === 'driver' && activeTab === 'driver' && session.ambulanceId && (
            <DriverDashboard ambulanceId={session.ambulanceId} />
          )}
          {session.role === 'hospital' && activeTab === 'hospital' && session.facilityId && (
            <HospitalDashboard facilityId={session.facilityId} />
          )}

          <footer className="mt-12 pt-6 pb-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">ResQRoutes — Smart Emergency Response & Hospital Routing SaaS Platform</p>
            <p className="text-[11px] text-slate-400">Deterministic role-based emergency workflow • Dijkstra & A* routing • No real emergency calls are generated.</p>
          </footer>
        </main>
      </div>

    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => restoreSession());
  const logout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <SimulationProvider>
      {session ? <AppContent session={session} onLogout={logout} /> : <AuthPage onAuthenticate={setSession} />}
    </SimulationProvider>
  );
}
