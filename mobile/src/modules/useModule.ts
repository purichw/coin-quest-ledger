import { useCallback, useEffect, useRef } from 'react';
import type { Account } from '../auth/contracts';
import { useLoad } from '../player/ui';
import { loadModule } from './service';
import type { ModuleKey } from './types';

export function useModule<K extends ModuleKey>(key: K, account: Account) {
  const latest = useRef(account); useEffect(() => { latest.current = account; }, [account]);
  // Foreground account refreshes must not discard a form draft. Only a different
  // identity or route focus requires a new module load.
  const identity = `${account.uid}:${account.characterId}`;
  const loader = useCallback(() => { void identity; return loadModule(key, latest.current); }, [key, identity]);
  return useLoad(loader);
}
