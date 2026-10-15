import { useEffect, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Share, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Action, ErrorNote, ui } from '../auth/ui';
import { Experience } from './Home';
import { usePlayerProfile } from './profile-service';
import { canon } from '../domain/canon';
import { setBoardArchived } from '../ledger/service';
import { scenicStackOptions } from '../player/navigation';
import { PublicProfile } from './public-profile';
import { profileTarget } from './public-profile-contracts';
import { ProfileIdentity, ProfilePrivacy } from './profile-identity';
import { Body, Card, confirm, Disclosure, LoadError, Loading, money, Page, PlayerGate, Row, Stats, useWork, type Player } from '../player/ui';
export default function CharacterRoute() {
  const params = useLocalSearchParams<{ id?: string | string[]; private?: string | string[] }>();
  return <PlayerGate>{player => {
    const target = profileTarget(params.id, player.account.characterId);
    if (target.kind === 'invalid') return <Page><ErrorNote message="ใช้ Character ID 4 หลัก" /><Action title="โปรไฟล์ของฉัน" secondary onPress={() => router.replace('/character')} /></Page>;
    return target.kind === 'own' ? <CharacterScreen key={`${player.account.uid}:${params.private === '1'}`} {...player} privateMode={params.private === '1'} /> : <PublicProfile key={`${player.account.uid}:${target.id}:${params.private === '1'}`} id={target.id} viewerUid={player.account.uid} privateMode={params.private === '1'} />;
  }}</PlayerGate>;
}
function CharacterScreen({ account, privateMode = false }: Player & { privateMode?: boolean }) {
  const load = usePlayerProfile(account); const work = useWork(); const [hidden, setHidden] = useState(true); const [privacyReady, setPrivacyReady] = useState(false); const privacyKey = `coinquest.privacy.${account.uid}`;
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(privacyKey).then(value => { if (mounted) { setHidden(privateMode || value === '1'); setPrivacyReady(true); } }).catch(() => { if (mounted) setPrivacyReady(true); });
    return () => { mounted = false; };
  }, [privacyKey, privateMode]);
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const { hero, profile, progress, activity } = load.data; const value = (n: number) => hidden ? '••••' : money(n);
  return <Page scene="character"><Stack.Screen options={{ ...scenicStackOptions, title: 'โปรไฟล์นักผจญภัย' }} />
    <ProfileIdentity hero={hero} username={account.username} onEdit={() => router.push('/character-edit')} onShare={() => void work.run(() => Share.share({ url: `https://coinquestledger.vercel.app/character/?id=${hero.id}${hidden ? '&private=1' : ''}`, message: hero.name }))} />
    <ProfilePrivacy hidden={hidden} disabled={!privacyReady} onChange={next => { setHidden(next); void AsyncStorage.setItem(privacyKey, next ? '1' : '0'); }} />
    <Experience character={hero} /><Disclosure title="Reputation · ชื่อเสียง"><Stats items={[["เลเวลชื่อเสียง", String(progress.level.lvl)], ["Reputation", String(progress.reputation)]]} /><Body>Party Ledger {progress.splitReputation} · Debt Dragon {progress.debtReputation}</Body><Body>Treasury {progress.treasuryReputation} · Price Arena {progress.compareReputation}</Body><Body>เข้าใช้งานต่อเนื่อง {activity.streak} วัน · สถิติสูงสุด {activity.bestStreak} วัน</Body></Disclosure>
    <Card title="สถิติการผจญภัย"><Stats items={[["บอร์ดที่ร่วม", String(profile.totals.boards)], ["รายการปาร์ตี้", String(progress.quests)], ["จ่ายหนี้สะสม", value(progress.reclaimed)], ["เดือนที่คุมงบ", String(progress.monthsWon)]]} /><Body>เงินออกแทนปาร์ตี้ {value(profile.totals.fronted)} · หนี้ที่ปิดแล้ว {progress.slain}</Body><Body>เทียบราคา {progress.showdowns} สินค้า · ส่วนลดที่ดีที่สุด {progress.bestRescue}%</Body></Card>
    <Disclosure title="หอเกียรติยศ">{canon.PLAYER_ACHIEVEMENTS.map(t => { const unlocked = t.test(progress); const status = t.prog?.(progress); return <View key={t.id} style={{ gap: 4, paddingVertical: 8 }}><Text style={ui.value}>{unlocked ? t.icon : '🔒'} {t.th[0]} {unlocked ? '✓' : ''}</Text><Body>{t.th[1]}{!unlocked && status ? ` · ${status[0].toLocaleString()} / ${status[1].toLocaleString()}` : ''}</Body></View>; })}</Disclosure>
    <Disclosure title={`ประวัติบอร์ด · ${profile.boards.length}`}>{profile.boards.length ? profile.boards.map(b => <View key={`${b.id}:${b.name}`} style={{ gap: 8 }}><Row title={`${b.tripName} · #${b.id}`} detail={`${b.quests} รายการ · ส่วนแบ่ง ${value(b.share)}${b.archived ? ' · เก็บไว้' : ''}`} onPress={() => router.push({ pathname: '/split/board', params: { id: b.id } })} />{b.isAdminLinked && <Action title={b.archived ? `เปิดบอร์ด ${b.tripName} อีกครั้ง` : `เก็บบอร์ด ${b.tripName}`} secondary busy={work.busy} onPress={() => confirm(b.archived ? 'เปิดใช้งานบอร์ดอีกครั้ง?' : 'เก็บบอร์ดนี้?', 'ข้อมูลและประวัติยังอยู่ เปลี่ยนกลับได้จากโปรไฟล์', () => void work.run(async () => { await setBoardArchived(b.id, account, !b.archived); await load.reload(); }))} />}</View>) : <Body>ยังไม่มีประวัติปาร์ตี้</Body>}</Disclosure>
    <ErrorNote message={work.error || load.error} /><Action title="รีเฟรชโปรไฟล์" secondary busy={load.loading} onPress={load.reload} /></Page>;
}
