import { Image, type ImageSourcePropType } from 'react-native';
const art: Record<string, ImageSourcePropType> = {
  card: require('../../../assets/debt-dragons/card.png'),
  autoloan: require('../../../assets/debt-dragons/autoloan.png'),
  mortgage: require('../../../assets/debt-dragons/mortgage.png'),
  student: require('../../../assets/debt-dragons/student.png'),
  medical: require('../../../assets/debt-dragons/medical.png'),
  tax: require('../../../assets/debt-dragons/tax.png'),
  other: require('../../../assets/debt-dragons/other.png'),
};
export function DragonArt({ type, uri }: { type: string; uri?: string }) { return <Image source={uri ? { uri } : art[type] || art.other} accessibilityLabel="มังกรหนี้" resizeMode="contain" style={{ width: '100%', height: 170 }} />; }
