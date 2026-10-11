import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { acknowledgeRecovery, completeSignup, loadAccount, login, regenerateRecovery, signup } from './account-service';
import { auth } from './firebase';
import { authMessage, type Account, type SignupFields } from './contracts';
import { createCharacter } from '../character/service';
import type { Character, CharacterDraft } from '../character/contracts';

type Session =
  | { status: 'loading' }
  | { status: 'signed-out'; notice?: string }
  | { status: 'incomplete'; name: string; username: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; account: Account; recoveryCode: string | null; character: Character | null };

type AuthContextValue = {
  session: Session;
  busy: boolean;
  signupDraft: SignupFields;
  updateSignupDraft: (patch: Partial<SignupFields>) => void;
  signIn: (username: string, password: string) => Promise<string>;
  signUp: (fields: SignupFields) => Promise<string>;
  finishSignup: (name: string) => Promise<string>;
  logOut: () => Promise<string>;
  saveRecovery: () => Promise<string>;
  regenerateRecovery: () => Promise<string>;
  characterDraft: CharacterDraft;
  updateCharacterDraft: (patch: Partial<CharacterDraft>) => void;
  createHero: (draft: CharacterDraft) => Promise<string>;
  retry: () => void;
};
const Context = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  // In-memory only: native Back preserves an unfinished form, never its password on disk.
  const [signupDraft, setSignupDraft] = useState<SignupFields>({ name: '', username: '', password: '', confirmation: '' });
  const [heroDraft, setHeroDraft] = useState<{ uid: string; fields: CharacterDraft } | null>(null);
  const operation = useRef(false);
  const revision = useRef(0);

  const resolve = useCallback(async (user: User | null, currentRevision: number) => {
    const accept = (next: Session) => {
      if (revision.current === currentRevision) {
        setSession(next);
        if (next.status === 'ready' || next.status === 'incomplete') {
          setSignupDraft({ name: '', username: '', password: '', confirmation: '' });
        }
        if (next.status === 'signed-out' || (next.status === 'ready' && next.character)) setHeroDraft(null);
      }
    };
    if (!user) { accept({ status: 'signed-out' }); return; }
    try {
      const result = await loadAccount(user);
      if (auth.currentUser?.uid !== user.uid) return;
      accept(result.account
        ? { status: 'ready', account: result.account, recoveryCode: result.recoveryCode, character: result.character }
        : { status: 'incomplete', name: result.pending?.name || '', username: result.pending?.username || user.displayName || user.email?.split('@')[0] || '' });
    } catch (error) {
      if (revision.current !== currentRevision) return;
      const code = (error as { code?: string }).code;
      if (['account/blocked', 'auth/user-disabled', 'auth/user-token-expired', 'auth/invalid-user-token'].includes(code || '')) {
        await signOut(auth);
        setSession({ status: 'signed-out', notice: authMessage(error) });
      } else {
        accept({ status: 'error', message: authMessage(error) });
      }
    }
  }, []);

  const refresh = useCallback((keepVisible = false) => {
    if (operation.current) return;
    const currentRevision = ++revision.current;
    // A foreground validation must not unmount an unfinished player form.
    // Writes independently re-read the account in their Firebase transaction.
    setSession(current => keepVisible && current.status === 'ready' ? current : { status: 'loading' });
    void resolve(auth.currentUser, currentRevision);
  }, [resolve]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!operation.current) {
        setSession({ status: 'loading' });
        void resolve(user, ++revision.current);
      }
    });
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active' && auth.currentUser) refresh(true);
    });
    return () => { unsubscribe(); foreground.remove(); revision.current += 1; };
  }, [refresh, resolve]);

  async function run(work: () => Promise<unknown>) {
    if (operation.current) return '';
    operation.current = true;
    const currentRevision = ++revision.current;
    setBusy(true);
    try {
      await work();
      await resolve(auth.currentUser, currentRevision);
      return '';
    } catch (error) {
      // Auth creation and Firestore provisioning are different services. A partial
      // signup stays resumable instead of returning a misleading success or creating twice.
      if (auth.currentUser) await resolve(auth.currentUser, currentRevision);
      return authMessage(error);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  return <Context.Provider value={{
    session, busy, signupDraft,
    characterDraft: session.status === 'ready' && heroDraft?.uid === session.account.uid ? heroDraft.fields : { name: session.status === 'ready' ? session.account.name : '', classId: '', gender: 'female' },
    updateCharacterDraft: patch => {
      if (session.status !== 'ready') return;
      const account = session.account;
      setHeroDraft(previous => ({ uid: account.uid, fields: { ...(previous?.uid === account.uid ? previous.fields : { name: account.name, classId: '' as const, gender: 'female' as const }), ...patch } }));
    },
    createHero: draft => run(() => {
      if (!auth.currentUser) throw new Error('No active user');
      return createCharacter(auth.currentUser.uid, draft);
    }),
    updateSignupDraft: patch => setSignupDraft(previous => ({ ...previous, ...patch })),
    signIn: (username, password) => run(() => login(username, password)),
    signUp: fields => run(() => signup(fields)),
    finishSignup: name => run(() => {
      if (!auth.currentUser) throw new Error('No active user');
      return completeSignup(auth.currentUser, name);
    }),
    logOut: () => run(() => signOut(auth)),
    saveRecovery: () => run(() => {
      if (!auth.currentUser) throw new Error('No active user');
      return acknowledgeRecovery(auth.currentUser.uid);
    }),
    regenerateRecovery: () => run(() => {
      if (session.status !== 'ready') throw new Error('No active account');
      return regenerateRecovery(session.account);
    }),
    retry: () => refresh(),
  }}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider missing');
  return value;
}
