'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { leagues, type League } from '@/lib/maydan/data';

type State = { attendance: Record<string, boolean>; requests: string[]; read: string[]; paid: string[]; bookings: Record<string, string>; blocked: string[]; roster: string[]; lineup: string[]; profile: Record<string, string>; customLeagues: League[]; announcements: { title: string; body: string }[]; reports: Record<string, { home: number; away: number; status: string }>; freeAgent: boolean; preferences: Record<string, boolean> };
const initial: State = { attendance: {}, requests: [], read: [], paid: [], bookings: {}, blocked: [], roster: ['ahmad','omar','yazan','mahmoud','khaled','anas','tariq','sami','mohammad'], lineup: ['ahmad','omar','yazan','mahmoud','khaled','anas','tariq'], profile: { name: 'Ahmad Darwish', city: 'Jenin', position: 'Midfielder', foot: 'Right', bio: 'Friday football. Always.' }, customLeagues: [], announcements: [], reports: {}, freeAgent: false, preferences: { matches: true, teams: true, payments: true, announcements: true } };
type Context = { locale: string; setLocale: (s: string) => void; t: (en: string, ar?: string) => string; state: State; update: (fn: (s: State) => State) => void; notify: (text: string) => void; allLeagues: League[]; ready: boolean };
const AppContext = createContext<Context | null>(null);
export function MaydanProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState('en');
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
    if (cancelled) return;
    try {
      const saved = localStorage.getItem('maydan.workspace.v1');
      if (saved) { const parsed = JSON.parse(saved); if (parsed && typeof parsed === 'object' && Array.isArray(parsed.roster) && Array.isArray(parsed.customLeagues)) setState({ ...initial, ...parsed }); }
      setLocale(localStorage.getItem('maydan.locale') === 'ar' ? 'ar' : 'en');
    } catch { /* A blocked or full storage falls back to in-memory interaction. */ }
    setReady(true);
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem('maydan.workspace.v1', JSON.stringify(state)); localStorage.setItem('maydan.locale', locale); } catch { /* Keep the session usable if storage is unavailable. */ } } }, [state, locale, ready]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  const update = useCallback((fn: (s: State) => State) => setState(fn), []);
  const allLeagues = [...leagues.filter(l => !state.customLeagues.some(saved => saved.id === l.id)), ...state.customLeagues];
  return <AppContext.Provider value={{ locale, setLocale, t: (en, ar) => locale === 'ar' && ar ? ar : en, state, update, notify: setToast, allLeagues, ready }}>{children}<div className={`md-toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast}</div></AppContext.Provider>;
}
export function useMaydan() { const context = useContext(AppContext); if (!context) throw new Error('MaydanProvider is required'); return context; }
