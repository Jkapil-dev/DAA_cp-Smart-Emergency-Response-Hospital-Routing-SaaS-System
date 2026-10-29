import type { AuthSession } from './AuthPage';

export interface SavedAccount extends AuthSession {
  password: string;
  employeeId?: string;
  staffId?: string;
  unitCallSign?: string;
  facilityName?: string;
}

const ACCOUNTS_KEY = 'resqroutes_accounts';
const SESSION_KEY = 'resqroutes_session';

export const readAccounts = (): SavedAccount[] => {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]') as SavedAccount[]; }
  catch { return []; }
};

export const saveAccounts = (accounts: SavedAccount[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const saveSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const restoreSession = (): AuthSession | null => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as AuthSession | null;
    if (!session) return null;
    if (session.id) return session;
    const accounts = readAccounts();
    const account = accounts.find((item) => item.email === session.email && item.role === session.role);
    const restored = {
      ...session,
      id: account?.id || `USR-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    saveSession(restored);
    if (account && !account.id) {
      account.id = restored.id;
      saveAccounts(accounts);
    }
    return restored;
  }
  catch { return null; }
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);
