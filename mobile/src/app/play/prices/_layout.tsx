import { Stack } from 'expo-router';
import { playerStackOptions } from '../../../player/navigation';
export default function PricesStack() { return <Stack screenOptions={{ ...playerStackOptions, title: 'เทียบราคา' }} />; }
