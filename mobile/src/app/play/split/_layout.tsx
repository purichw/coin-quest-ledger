import { Stack } from 'expo-router';
import { playerStackOptions } from '../../../player/navigation';
export default function SplitStack() { return <Stack screenOptions={{ ...playerStackOptions, title: 'แบ่งเงิน' }} />; }
