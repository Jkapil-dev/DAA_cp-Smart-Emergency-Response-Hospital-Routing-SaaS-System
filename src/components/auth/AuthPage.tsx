import React, { useState } from 'react';
import { Building2, HeartPulse, Navigation, ShieldCheck, User, LockKeyhole, ArrowRight } from 'lucide-react';
import { readAccounts, saveAccounts, saveSession } from './authStorage';
import type { SavedAccount } from './authStorage';
import { INITIAL_AMBULANCES } from '../../data/ambulances';
import { INITIAL_FACILITIES } from '../../data/facilities';

export type UserRole = 'reporter' | 'driver' | 'hospital';
export interface AuthSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  employeeId?: string;
  staffId?: string;
  unitCallSign?: string;
  ambulanceId?: string;
  facilityName?: string;
  facilityId?: string;
}
interface AuthPageProps { onAuthenticate: (session: AuthSession) => void }
const roles: Array<{ id: UserRole; label: string; description: string; icon: typeof User; accent: string }> = [
  { id: 'reporter', label: 'Emergency Reporter', description: 'Report an incident and track dispatch progress.', icon: HeartPulse, accent: 'border-rose-200 bg-rose-50 text-rose-700' },
  { id: 'driver', label: 'Ambulance Driver', description: 'Accept calls, navigate, and update patient status.', icon: Navigation, accent: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { id: 'hospital', label: 'Hospital Coordinator', description: 'Manage incoming requests, beds, and readiness.', icon: Building2, accent: 'border-blue-200 bg-blue-50 text-blue-700' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticate }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [role, setRole] = useState<UserRole>('reporter');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [ambulanceId, setAmbulanceId] = useState(INITIAL_AMBULANCES[0].id);
  const [facilityId, setFacilityId] = useState(INITIAL_FACILITIES[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readAccounts();

    if (mode === 'register') {
      if (!name.trim()) { setError('Enter your full name.'); return; }
      if (role === 'reporter' && !phone.trim()) { setError('Enter a callback mobile number.'); return; }
      if (role === 'driver' && (!employeeId.trim() || !ambulanceId)) {
        setError('Enter your employee ID and select an ambulance.');
        return;
      }
      if (role === 'hospital' && !staffId.trim()) {
        setError('Enter your hospital staff ID.');
        return;
      }
      if (accounts.some((account) => account.email === normalizedEmail)) { setError('An account with this email already exists.'); return; }
      if (role === 'driver' && accounts.some((account) => account.role === 'driver' && account.employeeId?.trim().toUpperCase() === employeeId.trim().toUpperCase())) {
        setError('An account with this employee ID already exists.');
        return;
      }
      if (role === 'hospital' && accounts.some((account) => account.role === 'hospital' && account.staffId?.trim().toUpperCase() === staffId.trim().toUpperCase())) {
        setError('An account with this staff ID already exists.');
        return;
      }
      if (password.length < 6) { setError('Password must contain at least 6 characters.'); return; }
      const selectedAmbulance = role === 'driver'
        ? INITIAL_AMBULANCES.find((ambulance) => ambulance.id === ambulanceId)
        : undefined;
      const selectedFacility = role === 'hospital'
        ? INITIAL_FACILITIES.find((facility) => facility.id === facilityId)
        : undefined;
      if ((role === 'driver' && !selectedAmbulance) || (role === 'hospital' && !selectedFacility)) {
        setError('Select a valid simulated resource for this account.');
        return;
      }
      const account: SavedAccount = {
        id: `USR-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
        name: name.trim(),
        email: normalizedEmail,
        phone: role === 'reporter' ? phone.trim() : '',
        role,
        employeeId: role === 'driver' ? employeeId.trim().toUpperCase() : undefined,
        staffId: role === 'hospital' ? staffId.trim().toUpperCase() : undefined,
        unitCallSign: selectedAmbulance?.callSign,
        ambulanceId: selectedAmbulance?.id,
        facilityName: selectedFacility?.name,
        facilityId: selectedFacility?.id,
        password,
      };
      saveAccounts([...accounts, account]);
      const session: AuthSession = {
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        role: account.role,
        employeeId: account.employeeId,
        staffId: account.staffId,
        unitCallSign: account.unitCallSign,
        ambulanceId: account.ambulanceId,
        facilityName: account.facilityName,
        facilityId: account.facilityId,
      };
      saveSession(session);
      onAuthenticate(session);
      return;
    }

    const normalizedEmployeeId = employeeId.trim().toUpperCase();
    const normalizedStaffId = staffId.trim().toUpperCase();
    const account = accounts.find((item) => {
      if (item.role !== role || item.password !== password) return false;
      if (role === 'reporter') return item.email === normalizedEmail;
      if (role === 'driver') return item.employeeId === normalizedEmployeeId;
      return item.staffId === normalizedStaffId;
    });
    if (!account) {
      setError(role === 'reporter'
        ? 'Invalid email, password, or account type.'
        : role === 'driver'
          ? 'Invalid employee ID, password, or account type.'
          : 'Invalid staff ID, password, or account type.');
      return;
    }
    const assignedAmbulance = role === 'driver'
      ? INITIAL_AMBULANCES.find((ambulance) => ambulance.id === account.ambulanceId)
        || INITIAL_AMBULANCES.find((ambulance) => ambulance.callSign.toLowerCase() === account.unitCallSign?.trim().toLowerCase())
      : undefined;
    const assignedFacility = role === 'hospital'
      ? INITIAL_FACILITIES.find((facility) => facility.id === account.facilityId)
        || INITIAL_FACILITIES.find((facility) => facility.name.toLowerCase() === account.facilityName?.trim().toLowerCase())
      : undefined;
    if (role === 'driver' && !assignedAmbulance) {
      setError('This account is not linked to a simulated ambulance. Create a new account and select an assigned unit.');
      return;
    }
    if (role === 'hospital' && !assignedFacility) {
      setError('This account is not linked to a simulated facility. Create a new account and select an assigned facility.');
      return;
    }
    const accountId = account.id || `USR-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (!account.id || (assignedAmbulance && account.ambulanceId !== assignedAmbulance.id) || (assignedFacility && account.facilityId !== assignedFacility.id)) {
      account.id = accountId;
      account.ambulanceId = assignedAmbulance?.id;
      account.unitCallSign = assignedAmbulance?.callSign;
      account.facilityId = assignedFacility?.id;
      account.facilityName = assignedFacility?.name;
      saveAccounts(accounts);
    }
    const session: AuthSession = {
      id: accountId,
      name: account.name,
      email: account.email,
      phone: account.phone || '',
      role: account.role,
      employeeId: account.employeeId,
      staffId: account.staffId,
      unitCallSign: assignedAmbulance?.callSign,
      ambulanceId: assignedAmbulance?.id,
      facilityName: assignedFacility?.name,
      facilityId: assignedFacility?.id,
    };
    saveSession(session);
    onAuthenticate(session);
  };

  const RoleIcon = roles.find((item) => item.id === role)?.icon ?? User;
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/50 grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex flex-col justify-between bg-slate-900 p-10 text-white min-h-[650px]">
          <div>
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div><div><div className="font-black tracking-tight">ResQRoutes</div><div className="text-xs text-slate-400">Emergency response platform</div></div></div>
            <div className="mt-16 max-w-md"><p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-400">Simulation account portal</p><h1 className="mt-4 text-4xl font-black leading-tight">Every role. One coordinated response.</h1><p className="mt-5 text-sm leading-7 text-slate-300">Choose your workspace to report emergencies, operate an assigned simulated ambulance, or coordinate an assigned facility.</p></div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs font-bold text-slate-200">Response network is active</span></div></div>
        </section>

        <section className="p-6 sm:p-10 min-h-[650px]">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-end"><div className="flex rounded-xl bg-slate-100 p-1">{(['register', 'login'] as const).map((item) => <button key={item} type="button" onClick={() => { setMode(item); setError(''); }} className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition ${mode === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{item}</button>)}</div></div>
            <div className="mt-8"><h2 className="text-2xl font-black text-slate-900">{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2><p className="mt-1 text-sm text-slate-500">Select a role and, for staff, an existing simulated assignment.</p></div>

            <div className="mt-6 grid gap-2">{roles.map((item) => { const Icon = item.icon; const selected = role === item.id; return <button type="button" key={item.id} onClick={() => { setRole(item.id); setError(''); }} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? item.accent : 'border-slate-200 hover:border-slate-300'}`}><div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${selected ? 'bg-white/70' : 'bg-slate-100 text-slate-500'}`}><Icon className="w-5 h-5" /></div><div><div className="text-sm font-bold text-slate-900">{item.label}</div><div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div></div></button>; })}</div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {role === 'reporter' && (
                <>
                  {mode === 'register' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block"><span className="text-xs font-bold text-slate-700">Full name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" placeholder="Your name" autoComplete="name" required /></label>
                      <label className="block"><span className="text-xs font-bold text-slate-700">Mobile number</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" placeholder="For callback" autoComplete="tel" required /></label>
                    </div>
                  )}
                  <label className="block"><span className="text-xs font-bold text-slate-700">Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" placeholder="you@example.com" autoComplete="email" required /></label>
                </>
              )}

              {role === 'driver' && (
                <>
                  {mode === 'register' && (
                    <label className="block"><span className="text-xs font-bold text-slate-700">Driver name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Paramedic / driver name" autoComplete="name" required /></label>
                  )}
                  <div className={mode === 'register' ? 'grid gap-4 sm:grid-cols-2' : ''}>
                    <label className="block"><span className="text-xs font-bold text-slate-700">Employee ID</span><input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="EMS-1042" required /></label>
                    {mode === 'register' && (
                      <label className="block">
                        <span className="text-xs font-bold text-slate-700">Assigned ambulance</span>
                        <select value={ambulanceId} onChange={(event) => setAmbulanceId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" required>
                          {INITIAL_AMBULANCES.map((ambulance) => (
                            <option key={ambulance.id} value={ambulance.id}>{ambulance.callSign} ({ambulance.type})</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  {mode === 'register' && <label className="block"><span className="text-xs font-bold text-slate-700">Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="driver@ems.gov" autoComplete="email" required /></label>}
                </>
              )}

              {role === 'hospital' && (
                <>
                  {mode === 'register' && (
                    <label className="block"><span className="text-xs font-bold text-slate-700">Coordinator name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Hospital coordinator" autoComplete="name" required /></label>
                  )}
                  <div className={mode === 'register' ? 'grid gap-4 sm:grid-cols-2' : ''}>
                    <label className="block"><span className="text-xs font-bold text-slate-700">Hospital staff ID</span><input value={staffId} onChange={(event) => setStaffId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="HOSP-2201" required /></label>
                    {mode === 'register' && (
                      <label className="block">
                        <span className="text-xs font-bold text-slate-700">Assigned facility</span>
                        <select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" required>
                          {INITIAL_FACILITIES.map((facility) => (
                            <option key={facility.id} value={facility.id}>{facility.name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  {mode === 'register' && <label className="block"><span className="text-xs font-bold text-slate-700">Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="coordinator@hospital.org" autoComplete="email" required /></label>}
                </>
              )}

              <label className="block"><span className="text-xs font-bold text-slate-700">Password</span><div className="relative mt-1.5"><LockKeyhole className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10" placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required /></div></label>
              {error && <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}
              <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-blue-700 transition flex items-center justify-center gap-2"><RoleIcon className="w-4 h-4" />{mode === 'register' ? 'Create role account' : 'Login to workspace'}<ArrowRight className="w-4 h-4" /></button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};
