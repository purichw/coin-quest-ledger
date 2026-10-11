import { useCallback, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Action, ErrorNote, Field } from '../../auth/ui';
import { classes, normalizeClass, type ClassId, type Gender } from '../../character/catalog';
import { Portrait } from '../../character/Portrait';
import { skinOptions } from '../../character/skins';
import { editGuest } from '../../ledger/contracts';
import { canManageBoard, changeBoard, loadBoard } from '../../ledger/service';
import type { Board } from '../../ledger/types';
import { Body, Card, Choice, LoadError, Loading, p, Page, PlayerGate, useLoad, useWork, type Player } from '../../player/ui';
export default function GuestRoute() { const { id, name } = useLocalSearchParams<{ id: string; name: string }>(); return <PlayerGate>{player => <Load {...player} id={id} name={name} />}</PlayerGate>; }
function Load({ id, name, ...player }: Player & { id: string; name: string }) { const load = useLoad(useCallback(() => loadBoard(id), [id])); return load.data ? <Editor {...player} id={id} oldName={name} board={load.data} /> : load.error ? <LoadError error={load.error} retry={load.reload} /> : <Loading />; }
function Editor({ account, id, oldName, board }: Player & { id: string; oldName: string; board: Board }) {
  const work = useWork(); const [name, setName] = useState(oldName); const [classId, setClassId] = useState<ClassId>(normalizeClass(board.heroClasses[oldName])); const [gender, setGender] = useState<Gender>(board.heroGenders[oldName] === 'male' ? 'male' : 'female'); const [skin, setSkin] = useState(board.heroSkins[oldName] || '');
  return <Page><Stack.Screen options={{ title: 'แก้ไข Guest', headerBackButtonDisplayMode: 'minimal' }} /><Portrait classId={classId} gender={gender} skin={skin} style={{ height: 220 }} /><Card><Field label="ชื่อ Guest ใหม่" value={name} onChangeText={setName} maxLength={30} /><Body>เปลี่ยนชื่ออ้างอิงในรายการของแคมเปญปัจจุบันด้วย ยอดเงินและประวัติยังอยู่ครบ</Body><View style={p.choices}>{(['female', 'male'] as const).map(g => <Choice key={g} label={g === 'female' ? 'หญิง' : 'ชาย'} selected={gender === g} onPress={() => { setGender(g); setSkin(''); }} />)}</View><View style={p.choices}>{classes.map(c => <Choice key={c.id} label={c.th} selected={classId === c.id} onPress={() => { setClassId(c.id); setSkin(''); }} />)}</View><View style={p.choices}>{skinOptions(classId, gender).map(s => <Choice key={s.id} label={s.label} selected={skin === s.id} onPress={() => setSkin(s.id)} />)}</View><Action title="บันทึก Guest" disabled={!canManageBoard(board, account, id)} busy={work.busy} onPress={() => void work.run(async () => { await changeBoard(id, account, current => editGuest(current, oldName, name, classId, gender, skin), true); router.back(); })} /></Card><ErrorNote message={work.error} /></Page>;
}
