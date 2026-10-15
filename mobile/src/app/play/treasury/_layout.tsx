import { Stack } from 'expo-router';
import { playerStackOptions } from '../../../player/navigation';
export default function TreasuryStack() { return <Stack screenOptions={{ ...playerStackOptions, title: 'คลังหลวง' }} />; }
