import { useEffect, useState } from 'react';
import { router, Stack } from 'expo-router';
import { Share, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Action, ErrorNote, ui } from '../auth/ui';
import { Experience } from './Home';
import { Portrait } from './Portrait';
import { classInfo } from './catalog';
import { usePlayerProfile } from './profile-service';
import { canon } from '../domain/canon';
import { setBoardArchived } from '../ledger/service';
import { Body, Card, confirm, LoadError, Loading, money, Page, PlayerGate, Row, Stats, useWork, type Player } from '../player/ui';
export default function CharacterRoute() { return <PlayerGate>{p => <CharacterScreen {...p} />}</PlayerGate>; }
function CharacterScreen({ account }: Player) {
  const load = usePlayerProfile(account); const work = useWork(); const [hidden, setHidden] = useState(false); const privacyKey = `coinquest.privacy.${account.uid}`;
  useEffect(() => { void AsyncStorage.getItem(privacyKey).then(value => setHidden(value === '1')); }, [privacyKey]);
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const { hero, profile, progress, activity } = load.data; const value = (n: number) => hidden ? '••••' : money(n);
  return <Page><Stack.Screen options={{ title: 'โปรไฟล์นักผจญภัย' }} /><Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}><Portrait classId={hero.classId} gender={hero.gender} skin={hero.skin} style={{ width: 110, height: 160, borderRadius: 16 }} /><View style={{ flex: 1, gap: 7 }}><Text style={[ui.title, { fontSize: 22, lineHeight: 34 }]}>{hero.name}</Text><Body>{classInfo(hero.classId).th}</Body><Text style={ui.hint}>Character ID {hero.id}{'\n'}@{account.username}</Text></View></View><Action title="แต่งตัวและแก้ไขตัวละคร" secondary onPress={() => router.push('/character-edit')} /></Card>
    <Experience character={hero} /><Card title="Reputation · ชื่อเสียง"><Stats items={[["เลเวลชื่อเสียง", String(progress.level.lvl)], ["Reputation", String(progress.reputation)]]} /><Body>Party Ledger {progress.splitReputation} · Debt Dragon {progress.debtReputation}</Body><Body>Treasury {progress.treasuryReputation} · Price Arena {progress.compareReputation}</Body><Body>เข้าใช้งานต่อเนื่อง {activity.streak} วัน · สถิติสูงสุด {activity.bestStreak} วัน</Body></Card>
    <Card title="สถิติการผจญภัย"><Stats items={[["บอร์ดที่ร่วม", String(profile.totals.boards)], ["รายการปาร์ตี้", String(progress.quests)], ["จ่ายหนี้สะสม", value(progress.reclaimed)], ["เดือนที่คุมงบ", String(progress.monthsWon)]]} /><Body>เงินออกแทนปาร์ตี้ {value(profile.totals.fronted)} · หนี้ที่ปิดแล้ว {progress.slain}</Body><Body>เทียบราคา {progress.showdowns} สินค้า · ส่วนลดที่ดีที่สุด {progress.bestRescue}%</Body></Card>
    <Card title="หอเกียรติยศ">{canon.PLAYER_ACHIEVEMENTS.map(t => { const unlocked = t.test(progress); const status = t.prog?.(progress); return <View key={t.id} style={{ gap: 4, paddingVertical: 8 }}><Text style={ui.value}>{unlocked ? t.icon : '🔒'} {t.th[0]} {unlocked ? '✓' : ''}</Text><Body>{t.th[1]}{!unlocked && status ? ` · ${status[0].toLocaleString()} / ${status[1].toLocaleString()}` : ''}</Body></View>; })}</Card>
    <Card title="ประวัติบอร์ด">{profile.boards.length ? profile.boards.map(b => <View key={`${b.id}:${b.name}`} style={{ gap: 8 }}><Row title={`${b.tripName} · #${b.id}`} detail={`${b.quests} รายการ · ส่วนแบ่ง ${value(b.share)}${b.archived ? ' · เก็บไว้' : ''}`} onPress={() => router.push({ pathname: '/split/board', params: { id: b.id } })} />{b.isAdminLinked && <Action title={b.archived ? `เปิดบอร์ด ${b.tripName} อีกครั้ง` : `เก็บบอร์ด ${b.tripName}`} secondary busy={work.busy} onPress={() => confirm(b.archived ? 'เปิดใช้งานบอร์ดอีกครั้ง?' : 'เก็บบอร์ดนี้?', 'ข้อมูลและประวัติยังอยู่ เปลี่ยนกลับได้จากโปรไฟล์', () => void work.run(async () => { await setBoardArchived(b.id, account, !b.archived); await load.reload(); }))} />}</View>) : <Body>ยังไม่มีประวัติปาร์ตี้</Body>}</Card>
    <Card title="เครื่องมือโปรไฟล์"><Action title={hidden ? 'แสดงยอดเงิน' : 'ซ่อนยอดเงินบนหน้านี้'} secondary onPress={() => { setHidden(!hidden); void AsyncStorage.setItem(privacyKey, hidden ? '0' : '1'); }} /><Body>ซ่อนตัวเลขบนหน้าจอเพื่อความเป็นส่วนตัวขณะใช้งาน</Body><Action title="แชร์ลิงก์โปรไฟล์" secondary onPress={() => void work.run(() => Share.share({ url: `https://coin-quest-ledger.vercel.app/character/?id=${hero.id}${hidden ? '&private=1' : ''}`, message: hero.name }))} /></Card>
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชโปรไฟล์" secondary busy={load.loading} onPress={load.reload} /></Page>;
}
