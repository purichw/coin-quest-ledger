import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { Action, ErrorNote, Field } from '../auth/ui';
import { classes, type ClassId, type Gender } from '../character/catalog';
import { Portrait } from '../character/Portrait';
import { editCharacter } from '../character/profile-service';
import { skinOptions } from '../character/skins';
import { Body, Card, Choice, p, Page, PlayerGate, useWork, type Player } from '../player/ui';
export default function CharacterEditRoute() { return <PlayerGate>{player => <Edit {...player} />}</PlayerGate>; }
function Edit({ account, hero }: Player) {
  const { retry } = useAuth(); const work = useWork(); const [name, setName] = useState(hero.name); const [classId, setClassId] = useState<ClassId>(hero.classId); const [gender, setGender] = useState<Gender>(hero.gender); const [skin, setSkin] = useState(hero.skin);
  return <Page><Stack.Screen options={{ title: 'แต่งตัวละคร' }} /><Portrait classId={classId} gender={gender} skin={skin} style={{ height: 240, width: '100%', borderRadius: 20 }} /><Card><Field label="ชื่อตัวละคร" value={name} onChangeText={setName} maxLength={30} /><Body>Character ID {hero.id} และประวัติยังเป็นของตัวละครเดิม ชื่อในรายการปาร์ตี้เก่าจะคงอยู่เพื่ออ้างอิง</Body><View style={p.choices}>{(['female', 'male'] as const).map(g => <Choice key={g} label={g === 'female' ? 'หญิง' : 'ชาย'} selected={gender === g} onPress={() => { setGender(g); setSkin(''); }} />)}</View><View style={p.choices}>{classes.map(c => <Choice key={c.id} label={c.th} selected={classId === c.id} onPress={() => { setClassId(c.id); setSkin(''); }} />)}</View><View style={p.choices}>{skinOptions(classId, gender).map(s => <Choice key={s.id} label={s.label} selected={skin === s.id} onPress={() => setSkin(s.id)} />)}</View><Action title="บันทึกตัวละคร" busy={work.busy} onPress={() => void work.run(async () => { await editCharacter(account, { name, classId, gender, skin }); router.back(); retry(); })} /></Card><ErrorNote message={work.error} /></Page>;
}
