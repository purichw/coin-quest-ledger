import type { Persistence } from 'firebase/auth';

// Firebase 13 exposes this in its React Native runtime (dist/rn/index.js),
// but firebase/auth's shared declaration entry omits the RN-only export.
// Match the upstream ReactNativeAsyncStorage contract without weakening type checks.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
