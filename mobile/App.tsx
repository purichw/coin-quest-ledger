import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function App() {
  const [name, setName] = useState('');
  const [checks, setChecks] = useState(0);
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled">
        <View style={styles.mark}><Text style={styles.markText}>CQ</Text></View>
        <Text style={styles.eyebrow}>COIN QUEST LEDGER</Text>
        <Text style={styles.title}>{'เริ่มต้นใหม่\nบนพื้นฐานที่พร้อม'}</Text>
        <Text style={styles.description}>{'หน้าตรวจการติดตั้งสำหรับการพัฒนา\nทดสอบการแตะ คีย์บอร์ด และหน้าต่างของ iOS ก่อนเริ่มสร้างฟีเจอร์'}</Text>
        <View style={styles.panel}>
          <Text style={styles.label}>ชื่อสำหรับทดสอบคีย์บอร์ด</Text>
          <TextInput accessibilityLabel="ชื่อสำหรับทดสอบคีย์บอร์ด" style={styles.input} value={name} onChangeText={setName} placeholder="พิมพ์ชื่อที่นี่" placeholderTextColor="#8c887b" returnKeyType="done" autoCorrect={false} />
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]} onPress={() => { setChecks((value) => value + 1); Alert.alert('Coin Quest Ledger', name.trim() ? `สวัสดี ${name.trim()}` : 'ปุ่มและหน้าต่าง native ทำงานแล้ว', [{ text: 'เรียบร้อย' }]); }}>
            <Text style={styles.buttonText}>ทดสอบการทำงาน</Text>
          </Pressable>
          <Text accessibilityLiveRegion="polite" style={styles.result}>ทดสอบปุ่มแล้ว {checks} ครั้ง</Text>
        </View>
        <Text style={styles.note}>Development setup · ยังไม่เชื่อมข้อมูลบัญชี</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f3e9',
  },
  content: { flexGrow: 1, justifyContent: 'center', padding: 28, paddingTop: 28, paddingBottom: 50, gap: 18 },
  mark: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#174b3b', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  markText: { fontSize: 24, fontWeight: '700', color: '#f7e8b3' },
  eyebrow: { color: '#527060', fontWeight: '700', fontSize: 11, letterSpacing: 2.2 },
  title: { fontSize: 32, lineHeight: 46, fontWeight: '700', color: '#203e33' },
  description: { fontSize: 15, lineHeight: 25, color: '#6c7064' },
  panel: { marginTop: 12, padding: 22, borderRadius: 20, borderWidth: 1, borderColor: '#dedfd3', backgroundColor: '#fffdf6', gap: 16 },
  label: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#314d40' },
  input: { minHeight: 52, padding: 14, borderWidth: 1, borderColor: '#b7c3b7', borderRadius: 12, backgroundColor: '#fff', fontSize: 16, color: '#203e33' },
  button: { minHeight: 52, padding: 14, borderRadius: 12, backgroundColor: '#174b3b', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fffdf6' },
  result: { fontSize: 13, textAlign: 'center', color: '#527060' },
  note: { fontSize: 11, textAlign: 'center', color: '#6c7064', marginTop: 10 },
});
