import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { AccountSummary } from '../auth/AccountEntry';
import { AuthPage, colors } from '../auth/ui';

export default function AccountScreen() {
  const { session } = useAuth();
  if (session.status === 'loading') return <AuthPage header><ActivityIndicator color={colors.green} /></AuthPage>;
  if (session.status !== 'ready' || session.recoveryCode) return <Redirect href="/" />;
  return <AccountSummary account={session.account} header />;
}
