import React from 'react';
import { CalendarDays, CheckCircle2, Clock3, FileText, Mail, MapPin, Phone, ShieldCheck, User } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import type { AuthSession } from '../auth/AuthPage';

interface ProfilePageProps { session: AuthSession }

const roleLabels = { reporter: 'Emergency Reporter', driver: 'Ambulance Driver', hospital: 'Hospital Coordinator' };
const stageLabels: Record<string, string> = {
  reported: 'Report received', ambulance_searching: 'Ambulance searching', ambulance_assigned: 'Ambulance assigned',
  en_route_scene: 'On the way', scene_arrived: 'At the scene', assessment_updated: 'Assessment updated',
  destination_confirmed: 'Hospital confirmed', en_route_hospital: 'En route to hospital', hospital_arrived: 'At hospital',
  completed: 'Completed', escalated: 'Escalated',
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ session }) => {
  const { incidents } = useSimulation();
  const reportedIncidents = incidents.filter((incident) => {
    const observations = incident.initialObservations;
    if (observations.callerId) return observations.callerId === session.id;
    return session.role === 'reporter'
      && observations.callerName?.trim().toLowerCase() === session.name.trim().toLowerCase();
  });
  const completedCount = reportedIncidents.filter((incident) => incident.stage === 'completed').length;
  const activeCount = reportedIncidents.length - completedCount;
  const details: Array<[string, string]> = session.role === 'driver'
    ? [['Employee ID', session.employeeId || ''], ['Ambulance', session.unitCallSign || '']]
    : session.role === 'hospital'
      ? [['Staff ID', session.staffId || ''], ['Facility', session.facilityName || '']]
      : [['Mobile', session.phone || '']];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Account</p><h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">My profile</h1><p className="mt-2 text-sm text-slate-500">Your account information and emergency response history.</p></div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-blue-600 text-2xl font-black text-white shadow-lg">{session.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
              <div className="pb-1"><h2 className="text-xl font-black text-slate-900">{session.name}</h2><p className="mt-1 text-sm font-semibold text-blue-700">{roleLabels[session.role]}</p></div>
            </div>
            <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Verified account</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem icon={Mail} label="Email" value={session.email} />
            {details.map(([label, value]) => <InfoItem key={label} icon={label === 'Mobile' ? Phone : User} label={label} value={value || 'Not provided'} />)}
          </div>
        </div>
      </section>

      {session.role === 'reporter' ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Incidents reported" value={reportedIncidents.length} accent="bg-rose-50 text-rose-700" />
            <StatCard label="Currently active" value={activeCount} accent="bg-amber-50 text-amber-700" />
            <StatCard label="Completed" value={completedCount} accent="bg-emerald-50 text-emerald-700" />
          </section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-black text-slate-900">Incident history</h2><p className="mt-1 text-xs text-slate-500">Reports submitted from this account</p></div><FileText className="h-5 w-5 text-slate-400" /></div>
            {reportedIncidents.length === 0 ? (
              <div className="px-5 py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><FileText className="h-5 w-5 text-slate-400" /></div><p className="mt-3 font-bold text-slate-700">No incidents reported yet</p><p className="mt-1 text-xs text-slate-500">Your emergency reports will appear here.</p></div>
            ) : (
              <div className="divide-y divide-slate-100">{reportedIncidents.map((incident) => (
                <article key={incident.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-black text-slate-900">{incident.id}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${incident.stage === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{stageLabels[incident.stage] || incident.stage}</span></div>
                      <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-slate-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />{incident.locationAddress || `Node ${incident.locationNodeId}`}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-4 w-4" />{new Date(incident.reportedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Triage</p><p className="mt-1 text-sm font-black capitalize text-slate-800">{incident.severityEvaluation.severity}</p></div>
                  </div>
                </article>
              ))}</div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Clock3 className="h-5 w-5" /></div><div><h2 className="font-black text-slate-900">Workspace activity</h2><p className="mt-1 text-xs leading-5 text-slate-500">Operational history is shown in the role dashboard. This account profile keeps the latest identity and assignment details together.</p></div></div><div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> Account ready for assigned duties</div></section>
      )}
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) => (
  <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 flex items-center gap-2 truncate text-sm font-bold text-slate-800"><Icon className="h-4 w-4 shrink-0 text-slate-400" />{value}</p></div>
);

const StatCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-black ${accent}`}>{value}</p><p className="mt-3 text-xs font-bold leading-5 text-slate-600">{label}</p></div>
);
