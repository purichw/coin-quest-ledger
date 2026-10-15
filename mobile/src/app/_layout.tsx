import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../auth/AuthProvider';
import { colors } from '../auth/ui';
import { fontAssets } from '../theme/typography';
import { playerStackOptions } from '../player/navigation';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  if (fontError) throw fontError;
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><StatusBar style="dark" /><ActivityIndicator accessibilityLabel="กำลังเปิด Coin Quest" color={colors.green} /></View>;
  return <AuthProvider><StatusBar style="dark" /><Stack screenOptions={playerStackOptions}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="play" options={{ headerShown: false }} />
    <Stack.Screen name="signup" options={{ title: 'สมัครสมาชิก', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="recover" options={{ title: 'กู้บัญชี', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="backup" options={{ title: 'สำรองข้อมูล', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="split/guest" options={{ title: 'ผู้ร่วมทาง', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="account" options={{ title: 'บัญชีของฉัน', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="welcome" options={{ title: 'เริ่มต้น Coin Quest', presentation: 'modal' }} />
    <Stack.Screen name="character" options={{ title: 'ตัวละครของฉัน', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="character-edit" options={{ title: 'แต่งตัวละคร', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="split/index" options={{ title: 'แบ่งเงิน · Party Ledger', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="split/board" options={{ title: 'บอร์ดปาร์ตี้', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="split/expense" options={{ title: 'รายการจ่าย', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="split/people" options={{ title: 'ผู้ร่วมทาง', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="split/campaigns" options={{ title: 'แคมเปญ', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="split/settings" options={{ title: 'ตั้งค่าบอร์ด', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="reminders" options={{ title: 'การแจ้งเตือน', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="debt/index" options={{ title: 'Debt Dragon · มังกรหนี้', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="debt/dragon" options={{ title: 'รายละเอียดหนี้', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="debt/log" options={{ title: 'ประวัติการจ่าย', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="check" options={{ title: 'ตรวจการทำงาน', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="treasury/index" options={{ title: 'Treasury · คลังหลวง', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="treasury/edit" options={{ title: 'คลังหลวง', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="treasury/history" options={{ title: 'ประวัติคลังหลวง', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="prices/index" options={{ title: 'Price Arena · เทียบราคา', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="prices/item" options={{ title: 'สินค้า', headerBackButtonDisplayMode: 'minimal' }} />
    <Stack.Screen name="prices/offer" options={{ title: 'ราคา', headerBackButtonDisplayMode: 'minimal' }} />
  </Stack></AuthProvider>;
}
