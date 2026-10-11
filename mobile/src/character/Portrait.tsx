import { useState } from 'react';
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, ui } from '../auth/ui';
import { classInfo, type ClassId, type Gender } from './catalog';
import { portraitFor } from './portraits';

export function Portrait({ classId, gender, skin = '', style }: { classId: ClassId; gender: Gender; skin?: string; style?: StyleProp<ViewStyle> }) {
  return <PortraitImage key={`${classId}-${gender}-${skin}`} classId={classId} gender={gender} skin={skin} style={style} />;
}

function PortraitImage({ classId, gender, skin, style }: { classId: ClassId; gender: Gender; skin: string; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  return <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7ebdf', overflow: 'hidden' }, style]}>
    {failed ? <Text style={[ui.hint, { textAlign: 'center', color: colors.ink, padding: 8 }]}>โหลดภาพ{classInfo(classId).th}ไม่ได้</Text>
      : <Image source={portraitFor(classId, gender, skin)} accessibilityIgnoresInvertColors accessible={false} resizeMode="contain" onError={() => setFailed(true)} style={{ width: '100%', height: '100%' }} />}
  </View>;
}
