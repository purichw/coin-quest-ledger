import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '../../auth/ui';
import { PlayerGate } from '../../player/ui';

// These are UIKit destinations. Detail and editing routes remain native stacks,
// and each destination keeps its mounted form/scroll state when switching tabs.
export default function PlayerTabs() {
  return <PlayerGate>{() => <NativeTabs tintColor={colors.green} backgroundColor={colors.surface} disableTransparentOnScrollEdge>
    <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" /><NativeTabs.Trigger.Label>หน้าหลัก</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="split"><NativeTabs.Trigger.Icon sf="person.2" md="group" /><NativeTabs.Trigger.Label>แบ่งเงิน</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="debt"><NativeTabs.Trigger.Icon sf="flame" md="local_fire_department" /><NativeTabs.Trigger.Label>หนี้</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="prices"><NativeTabs.Trigger.Icon sf="scalemass" md="balance" /><NativeTabs.Trigger.Label>เทียบราคา</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="treasury"><NativeTabs.Trigger.Icon sf="building.columns" md="account_balance" /><NativeTabs.Trigger.Label>คลังหลวง</NativeTabs.Trigger.Label></NativeTabs.Trigger>
  </NativeTabs>}</PlayerGate>;
}
