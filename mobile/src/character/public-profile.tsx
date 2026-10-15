import { useCallback, useState } from 'react';
import { router, Stack } from 'expo-router';
import { Share, Text, View } from 'react-native';
import { Action, ErrorNote, ui } from '../auth/ui';
import { scenicStackOptions } from '../player/navigation';
import { Body, Card, Disclosure, LoadError, Loading, money, Page, Row, Stats, useLoad, useWork } from '../player/ui';
import { Experience } from './Home';
import { ProfileIdentity, ProfilePrivacy } from './profile-identity';
import { loadPublicProfile } from './public-profile-service';

export function PublicProfile({ id, viewerUid, privateMode = false }: { id: string; viewerUid: string; privateMode?: boolean }) {
  const loader = useCallback(() => loadPublicProfile(id, viewerUid), [id, viewerUid]);
  const load = useLoad(loader); const work = useWork(); const [hidden, setHidden] = useState(privateMode);
  if (!load.data) return load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />;
  const { hero, profile } = load.data; const amount = (value: number) => hidden ? '••••' : money(value);
  return <Page scene="character"><Stack.Screen options={{ ...scenicStackOptions, title: 'โปรไฟล์นักผจญภัย' }} />
    <ProfileIdentity hero={hero} onShare={() => void work.run(() => Share.share({ url: `https://coinquestledger.vercel.app/character/?id=${hero.id}${hidden ? '&private=1' : ''}`, message: hero.name }))} />
    <ProfilePrivacy hidden={hidden} onChange={setHidden} />
    <Experience character={hero} />
    <Card title="สถิติปาร์ตี้"><Stats items={[["บอร์ดที่ร่วม", String(profile.totals.boards)], ["รายการปาร์ตี้", String(profile.totals.quests)], ["จ่ายทั้งหมด", amount(profile.totals.paid)], ["เงินออกแทนปาร์ตี้", amount(profile.totals.fronted)]]} /><Body>เคลียร์แล้ว {profile.totals.settledBoards} บอร์ด</Body></Card>
    <Disclosure title="รางวัลจากการผจญภัย">{profile.badges.length ? profile.badges.map(badge => <View key={badge.id} style={{ gap: 4, paddingVertical: 8 }}><Text style={ui.value}>✦ {badge.label}</Text><Body>{badge.detail}</Body></View>) : <Body>ยังไม่มีรางวัลจากปาร์ตี้</Body>}</Disclosure>
    <Disclosure title={`ประวัติบอร์ด · ${profile.boards.length}`}>{profile.boards.length ? profile.boards.map(board => <Row key={`${board.id}:${board.name}`} title={`${board.tripName} · #${board.id}`} detail={`${board.quests} รายการ · ส่วนแบ่ง ${amount(board.share)}${board.archived ? ' · เก็บไว้' : ''}`} onPress={() => router.push({ pathname: '/split/board', params: { id: board.id } })} />) : <Body>ยังไม่มีประวัติปาร์ตี้</Body>}</Disclosure>
    <ErrorNote message={load.error || work.error} /><Action title="รีเฟรชโปรไฟล์" secondary busy={load.loading} onPress={load.reload} />
  </Page>;
}
