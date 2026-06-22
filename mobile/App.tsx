import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Text, View } from 'react-native';
import {
  addExpenseToTrip,
  authErrorMessage,
  createBoard,
  createCharacter,
  isBlocked,
  loadAccount,
  loadCharacterForAccount,
  loadPlayerModules,
  loadTripsForCharacter,
  regenerateRecoveryCode,
  saveCompareModule,
  saveDebtModule,
  saveTreasuryModule,
  signInWithUsername,
  signOut,
  signUpWithUsername,
  watchSignedInUser,
} from './src/data';
import { comparisonFromInput, dragonFromInput, monthKey, offerFromInput, strikeDragon, todayIso, uid } from './src/gameLogic';
import { buildCharacterProfile } from './src/pointy';
import { CharacterCreation, LoginScreen } from './src/screens/auth';
import { HomeScreen } from './src/screens/home';
import { CompareScreen, DebtScreen, TreasuryScreen } from './src/screens/modules';
import { CharacterProfileScreen } from './src/screens/profile';
import { SplitScreen } from './src/screens/split';
import {
  BoardSheet,
  CompareSheet,
  DragonSheet,
  ExpenseSheet,
  OfferSheet,
  ProfileSheet,
  RecoverySheet,
  StrikeSheet,
  TreasurySheet,
} from './src/sheets';
import { palette, ui } from './src/theme';
import { BottomTabs, Shell, TopChrome } from './src/ui';
import { copy, type SheetKey, type ViewKey } from './src/copy';
import type { Account, CharacterRecord, Gender, Lang, PlayerModules, ThemeName, TripState } from './src/types';

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<ThemeName>('tavern');
  const [view, setView] = useState<ViewKey>('home');
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [character, setCharacter] = useState<CharacterRecord | null>(null);
  const [trips, setTrips] = useState<TripState[]>([]);
  const [modules, setModules] = useState<PlayerModules | null>(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [selectedDragonId, setSelectedDragonId] = useState('');
  const [selectedComparisonId, setSelectedComparisonId] = useState('');

  const c = copy[lang];
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || trips[0] || null;
  const selectedDragon = modules?.debt.dragons.find((dragon) => dragon.id === selectedDragonId) || null;
  const profile = useMemo(() => (character ? buildCharacterProfile(character.id, trips, character, lang) : null), [character, lang, trips]);

  const hydrate = useCallback(async (nextAccount: Account) => {
    const nextCharacter = await loadCharacterForAccount(nextAccount);
    const nextTrips = nextCharacter ? await loadTripsForCharacter(nextCharacter.id) : [];
    const nextModules = nextCharacter ? await loadPlayerModules(nextAccount, nextCharacter) : null;
    setAccount({ ...nextAccount, character: nextCharacter, characterId: nextCharacter?.id || nextAccount.characterId });
    setCharacter(nextCharacter);
    setTrips(nextTrips);
    setModules(nextModules);
    setSelectedTripId((current) => (current && nextTrips.some((trip) => trip.id === current) ? current : nextTrips[0]?.id || ''));
  }, []);

  useEffect(() => {
    const unsub = watchSignedInUser(async (user) => {
      setBooting(true);
      setError('');
      try {
        if (!user) {
          setAccount(null);
          setCharacter(null);
          setTrips([]);
          setModules(null);
          return;
        }
        const nextAccount = await loadAccount(user);
        if (isBlocked(nextAccount)) throw new Error('blocked-account');
        await hydrate(nextAccount);
      } catch (err) {
        setError(authErrorMessage(err));
      } finally {
        setBooting(false);
      }
    });
    return unsub;
  }, [hydrate]);

  const reload = useCallback(async () => {
    if (!account) return;
    setRefreshing(true);
    setError('');
    try {
      await hydrate(account);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, [account, hydrate]);

  if (booting) {
    return (
      <Shell theme={theme}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={palette.accent} size="large" />
          <Text style={ui.muted}>Connecting to Firebase...</Text>
        </View>
      </Shell>
    );
  }

  if (!account) {
    return (
      <Shell theme={theme}>
        <LoginScreen
          c={c}
          error={error}
          busy={busy}
          lang={lang}
          onLang={() => setLang(lang === 'th' ? 'en' : 'th')}
          onTheme={() => setTheme(theme === 'dungeon' ? 'tavern' : 'dungeon')}
          onSubmit={async (mode, username, password, displayName) => {
            setBusy(true);
            setError('');
            try {
              if (mode === 'in') {
                const next = await signInWithUsername(username, password);
                await hydrate(next);
              } else {
                const result = await signUpWithUsername(username, password, displayName);
                setRecoveryCode(result.recoveryCode);
                setSheet('recovery');
                await hydrate(result.account);
              }
            } catch (err) {
              setError(authErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        />
        <RecoverySheet visible={sheet === 'recovery'} code={recoveryCode} onClose={() => setSheet(null)} />
      </Shell>
    );
  }

  if (!character) {
    return (
      <Shell theme={theme}>
        <CharacterCreation
          account={account}
          c={c}
          lang={lang}
          busy={busy}
          error={error}
          onCreate={async (input: { name: string; cls: string; gender: Gender }) => {
            setBusy(true);
            setError('');
            try {
              const rec = await createCharacter(account, input);
              await hydrate({ ...account, character: rec, characterId: rec.id });
            } catch (err) {
              setError(authErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
          onSignOut={async () => signOut()}
        />
      </Shell>
    );
  }

  const saveModules = async <T,>(work: () => Promise<T>): Promise<T | null> => {
    if (!modules) return null;
    setBusy(true);
    setError('');
    try {
      return await work();
    } catch (err) {
      setError(authErrorMessage(err));
      return null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell theme={theme}>
      <SafeAreaView style={ui.safe}>
        <TopChrome
          character={character}
          lang={lang}
          theme={theme}
          onProfile={() => setSheet('profile')}
          onLang={() => setLang(lang === 'th' ? 'en' : 'th')}
          onTheme={() => setTheme(theme === 'dungeon' ? 'tavern' : 'dungeon')}
        />

        {error ? <Text style={{ color: palette.danger, fontWeight: '900', marginHorizontal: 18 }}>{error}</Text> : null}

        <ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
          {view === 'home' ? <HomeScreen profile={profile} trips={trips} selectedTrip={selectedTrip} modules={modules} lang={lang} onNewBoard={() => setSheet('newBoard')} onOpen={setView} /> : null}
          {view === 'split' ? <SplitScreen trip={selectedTrip} trips={trips} lang={lang} onPick={setSelectedTripId} onAdd={() => setSheet('expense')} onNewBoard={() => setSheet('newBoard')} /> : null}
          {view === 'debt' ? <DebtScreen modules={modules} lang={lang} onAddDragon={() => setSheet('dragon')} onStrike={(id) => { setSelectedDragonId(id); setSheet('strike'); }} /> : null}
          {view === 'treasury' ? <TreasuryScreen modules={modules} lang={lang} onLogExpense={() => setSheet('treasury')} /> : null}
          {view === 'compare' ? <CompareScreen modules={modules} lang={lang} onAddCompare={() => setSheet('compare')} onAddOffer={(id) => { setSelectedComparisonId(id); setSheet('offer'); }} /> : null}
          {view === 'character' ? <CharacterProfileScreen profile={profile} character={character} lang={lang} /> : null}
        </ScrollView>

        <BottomTabs view={view} lang={lang} onChange={setView} onPlus={() => {
          if (view === 'split') setSheet('expense');
          else if (view === 'debt') setSheet('dragon');
          else if (view === 'treasury') setSheet('treasury');
          else if (view === 'compare') setSheet('compare');
          else setSheet('newBoard');
        }} />
      </SafeAreaView>

      <ProfileSheet
        visible={sheet === 'profile'}
        account={account}
        character={character}
        profile={profile}
        busy={busy}
        onClose={() => setSheet(null)}
        onRegenerateRecovery={async () => {
          setBusy(true);
          setError('');
          try {
            const code = await regenerateRecoveryCode(account);
            setAccount({ ...account, recoveryCode: code, recoveryIssuedAt: Date.now() });
          } catch (err) {
            setError(authErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
        onSignOut={async () => signOut()}
      />
      <BoardSheet visible={sheet === 'newBoard'} busy={busy} lang={lang} onClose={() => setSheet(null)} onCreate={async (name) => {
        setBusy(true);
        setError('');
        try {
          const trip = await createBoard(account, character, name);
          await reload();
          setSelectedTripId(trip.id);
          setView('split');
          setSheet(null);
        } catch (err) {
          setError(authErrorMessage(err));
        } finally {
          setBusy(false);
        }
      }} />
      <ExpenseSheet visible={sheet === 'expense'} busy={busy} lang={lang} trip={selectedTrip} onClose={() => setSheet(null)} onCreate={async (desc, amount, paidBy) => {
        if (!selectedTrip) return;
        setBusy(true);
        setError('');
        try {
          await addExpenseToTrip(selectedTrip, {
            desc,
            amount,
            paidBy,
            sharedBy: selectedTrip.participants,
            split: { mode: 'equal' },
          });
          await reload();
          setSheet(null);
        } catch (err) {
          setError(authErrorMessage(err));
        } finally {
          setBusy(false);
        }
      }} />
      <DragonSheet visible={sheet === 'dragon'} busy={busy} lang={lang} onClose={() => setSheet(null)} onCreate={async (input) => {
        await saveModules(async () => {
          if (!modules) return;
          const nextDebt = { ...modules.debt, dragons: [dragonFromInput(input), ...modules.debt.dragons] };
          setModules(await saveDebtModule(modules, nextDebt));
          setSheet(null);
        });
      }} />
      <StrikeSheet visible={sheet === 'strike'} busy={busy} lang={lang} dragon={selectedDragon} onClose={() => setSheet(null)} onStrike={async (amount) => {
        await saveModules(async () => {
          if (!modules || !selectedDragon) return;
          const nextDebt = strikeDragon(modules.debt, selectedDragon.id, amount);
          setModules(await saveDebtModule(modules, nextDebt));
          setSheet(null);
        });
      }} />
      <TreasurySheet visible={sheet === 'treasury'} busy={busy} lang={lang} onClose={() => setSheet(null)} onSave={async (input) => {
        await saveModules(async () => {
          if (!modules) return;
          const nextTreasury = {
            ...modules.treasury,
            month: modules.treasury.month || monthKey(),
            income: input.income !== undefined ? input.income : modules.treasury.income,
            expenses: input.amount > 0 ? [{ id: uid('te'), name: input.name || 'Expense', category: input.category || 'general', amount: input.amount, date: todayIso() }, ...modules.treasury.expenses] : modules.treasury.expenses,
          };
          setModules(await saveTreasuryModule(modules, nextTreasury));
          setSheet(null);
        });
      }} />
      <CompareSheet visible={sheet === 'compare'} busy={busy} lang={lang} onClose={() => setSheet(null)} onCreate={async (name, unit) => {
        await saveModules(async () => {
          if (!modules) return;
          const next = [comparisonFromInput(name, unit), ...modules.comparisons];
          setModules(await saveCompareModule(modules, next));
          setSheet(null);
        });
      }} />
      <OfferSheet visible={sheet === 'offer'} busy={busy} lang={lang} onClose={() => setSheet(null)} onCreate={async (input) => {
        await saveModules(async () => {
          if (!modules || !selectedComparisonId) return;
          const next = modules.comparisons.map((comparison) => comparison.id === selectedComparisonId ? { ...comparison, offers: [...comparison.offers, offerFromInput(input)] } : comparison);
          setModules(await saveCompareModule(modules, next));
          setSheet(null);
        });
      }} />
      <RecoverySheet visible={sheet === 'recovery'} code={recoveryCode} onClose={() => setSheet(null)} />
    </Shell>
  );
}
