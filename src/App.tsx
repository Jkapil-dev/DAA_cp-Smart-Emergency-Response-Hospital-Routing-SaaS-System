import React, { useState } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { IncidentsTab } from './components/incidents/IncidentsTab';
import { AmbulanceDispatchTab } from './components/dispatch/AmbulanceDispatchTab';
import { HospitalsTab } from './components/hospitals/HospitalsTab';
import { AlgorithmLabTab } from './components/algorithms/AlgorithmLabTab';
import { ScenariosTab } from './components/scenarios/ScenariosTab';
import { IncidentReportModal } from './components/incidents/IncidentReportModal';
import { ReporterDashboard } from './components/reporter/ReporterDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { HospitalDashboard } from './components/hospital/HospitalDashboard';
import { PoliceCoordinationPanel } from './components/police/PoliceCoordinationPanel';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 antialiased font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header with Role Switcher */}
        <Header activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Tab Body View */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-8">
          {/* Role Dashboard A: Incident Reporter */}
          {activeTab === 'reporter' && <ReporterDashboard />}

          {/* Role Dashboard B: Ambulance Driver Cockpit */}
          {activeTab === 'driver' && <DriverDashboard />}

          {/* Role Dashboard C: Hospital Coordinator */}
          {activeTab === 'hospital' && <HospitalDashboard />}

          {/* Police & Traffic Coordination Panel */}
          {activeTab === 'police' && <PoliceCoordinationPanel />}

          {/* Operations & Command Center */}
          {activeTab === 'overview' && (
            <OverviewTab
              onSelectTab={setActiveTab}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsTab onOpenReportModal={() => setIsReportModalOpen(true)} />
          )}

          {activeTab === 'dispatch' && <AmbulanceDispatchTab />}

          {activeTab === 'hospitals' && <HospitalsTab />}

          {/* DAA Algorithm Lab */}
          {activeTab === 'algorithm-lab' && <AlgorithmLabTab />}

          {/* Automated System Scenarios */}
          {activeTab === 'scenarios' && <ScenariosTab />}

          {/* Academic DAA Simulation Disclaimer */}
          <footer className="mt-12 pt-6 pb-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">
              ResQRoutes — Smart Emergency Response & Hospital Routing SaaS Platform (DAA Academic Project)
            </p>
            <p className="text-[11px] text-slate-400">
              Deterministic rule-based triage • Dijkstra & A* Graph Optimization • Expanding Square-Grid Ambulance Discovery •
              Simulated road network, medical census, and traffic alerts.
            </p>
          </footer>
        </main>
      </div>

      {/* Global Incident Intake Modal */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}
