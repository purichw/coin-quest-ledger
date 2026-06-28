import type { ImageSourcePropType } from 'react-native';
import type { CharacterRecord } from './types';

const avatars: Record<string, ImageSourcePropType> = {
  'alchemist-female': require('../assets/avatars/alchemist-female.png'),
  'alchemist-male': require('../assets/avatars/alchemist-male.png'),
  'archfiend-female': require('../assets/avatars/archfiend-female.png'),
  'archfiend-male': require('../assets/avatars/archfiend-male.png'),
  'archfiend-swimmer-blackred-male': require('../assets/avatars/archfiend-swimmer-blackred-male.png'),
  'archfiend-swimmer-male': require('../assets/avatars/archfiend-swimmer-male.png'),
  'bard-female': require('../assets/avatars/bard-female.png'),
  'bard-male': require('../assets/avatars/bard-male.png'),
  'berserker-female': require('../assets/avatars/berserker-female.png'),
  'berserker-male': require('../assets/avatars/berserker-male.png'),
  'cleric-female': require('../assets/avatars/cleric-female.png'),
  'cleric-male': require('../assets/avatars/cleric-male.png'),
  'corsair-female': require('../assets/avatars/corsair-female.png'),
  'corsair-male': require('../assets/avatars/corsair-male.png'),
  'crimson-regent-male': require('../assets/avatars/crimson-regent-male.png'),
  'dragoon-female': require('../assets/avatars/dragoon-female.png'),
  'dragoon-male': require('../assets/avatars/dragoon-male.png'),
  'engineer-female': require('../assets/avatars/engineer-female.png'),
  'engineer-male': require('../assets/avatars/engineer-male.png'),
  'monk-female': require('../assets/avatars/monk-female.png'),
  'monk-male': require('../assets/avatars/monk-male.png'),
  'necromancer-female': require('../assets/avatars/necromancer-female.png'),
  'necromancer-male': require('../assets/avatars/necromancer-male.png'),
  'ranger-female': require('../assets/avatars/ranger-female.png'),
  'ranger-male': require('../assets/avatars/ranger-male.png'),
  'reveler-female': require('../assets/avatars/reveler-female.png'),
  'reveler-male': require('../assets/avatars/reveler-male.png'),
  'seraph-female': require('../assets/avatars/seraph-female.png'),
  'seraph-male': require('../assets/avatars/seraph-male.png'),
  'summoner-female': require('../assets/avatars/summoner-female.png'),
  'summoner-male': require('../assets/avatars/summoner-male.png'),
  'thief-female': require('../assets/avatars/thief-female.png'),
  'thief-male': require('../assets/avatars/thief-male.png'),
  'tiderunner-classic-female': require('../assets/avatars/tiderunner-classic-female.png'),
  'tiderunner-classic-male': require('../assets/avatars/tiderunner-classic-male.png'),
  'tiderunner-female': require('../assets/avatars/tiderunner-female.png'),
  'tiderunner-male': require('../assets/avatars/tiderunner-male.png'),
  'warrior-female': require('../assets/avatars/warrior-female.png'),
  'warrior-male': require('../assets/avatars/warrior-male.png'),
  'wizard-female': require('../assets/avatars/wizard-female.png'),
  'wizard-male': require('../assets/avatars/wizard-male.png'),
};

export const dragonAssets: Record<string, ImageSourcePropType> = {
  autoloan: require('../assets/dragons/autoloan.png'),
  card: require('../assets/dragons/card.png'),
  medical: require('../assets/dragons/medical.png'),
  mortgage: require('../assets/dragons/mortgage.png'),
  other: require('../assets/dragons/other.png'),
  student: require('../assets/dragons/student.png'),
  tax: require('../assets/dragons/tax.png'),
};

export function avatarFor(character?: Pick<CharacterRecord, 'class' | 'cls' | 'gender' | 'skin'> | null): ImageSourcePropType {
  const cls = character?.class || character?.cls || 'warrior';
  const gender = character?.gender === 'female' ? 'female' : 'male';
  const skin = character?.skin ? `${character.skin}-${gender}` : '';
  return avatars[skin] || avatars[`${cls}-${gender}`] || avatars['warrior-male'];
}
