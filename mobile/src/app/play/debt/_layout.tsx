import { Stack } from 'expo-router';
import { playerStackOptions } from '../../../player/navigation';
export default function DebtStack() { return <Stack screenOptions={{ ...playerStackOptions, title: 'มังกรหนี้' }} />; }
