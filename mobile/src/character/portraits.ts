import type { ImageSourcePropType } from 'react-native';
import type { ClassId, Gender } from './catalog';

const portraits: Record<string, ImageSourcePropType> = {
  'warrior-female': require('../../../assets/rpg-portraits/warrior-female.png'),
  'warrior-male': require('../../../assets/rpg-portraits/warrior-male.png'),
  'wizard-female': require('../../../assets/rpg-portraits/wizard-female.png'),
  'wizard-male': require('../../../assets/rpg-portraits/wizard-male.png'),
  'cleric-female': require('../../../assets/rpg-portraits/cleric-female.png'),
  'cleric-male': require('../../../assets/rpg-portraits/cleric-male.png'),
  'monk-female': require('../../../assets/rpg-portraits/monk-female.png'),
  'monk-male': require('../../../assets/rpg-portraits/monk-male.png'),
  'bard-female': require('../../../assets/rpg-portraits/bard-female.png'),
  'bard-male': require('../../../assets/rpg-portraits/bard-male.png'),
  'dragoon-female': require('../../../assets/rpg-portraits/dragoon-female.png'),
  'dragoon-male': require('../../../assets/rpg-portraits/dragoon-male.png'),
  'summoner-female': require('../../../assets/rpg-portraits/summoner-female.png'),
  'summoner-male': require('../../../assets/rpg-portraits/summoner-male.png'),
  'thief-female': require('../../../assets/rpg-portraits/thief-female.png'),
  'thief-male': require('../../../assets/rpg-portraits/thief-male.png'),
  'ranger-female': require('../../../assets/rpg-portraits/ranger-female.png'),
  'ranger-male': require('../../../assets/rpg-portraits/ranger-male.png'),
  'alchemist-female': require('../../../assets/rpg-portraits/alchemist-female.png'),
  'alchemist-male': require('../../../assets/rpg-portraits/alchemist-male.png'),
  'necromancer-female': require('../../../assets/rpg-portraits/necromancer-female.png'),
  'necromancer-male': require('../../../assets/rpg-portraits/necromancer-male.png'),
  'engineer-female': require('../../../assets/rpg-portraits/engineer-female.png'),
  'engineer-male': require('../../../assets/rpg-portraits/engineer-male.png'),
  'berserker-female': require('../../../assets/rpg-portraits/berserker-female.png'),
  'berserker-male': require('../../../assets/rpg-portraits/berserker-male.png'),
  'archfiend-female': require('../../../assets/rpg-portraits/archfiend-female.png'),
  'archfiend-male': require('../../../assets/rpg-portraits/archfiend-male.png'),
  'corsair-female': require('../../../assets/rpg-portraits/corsair-female.png'),
  'corsair-male': require('../../../assets/rpg-portraits/corsair-male.png'),
  'reveler-female': require('../../../assets/rpg-portraits/reveler-female.png'),
  'reveler-male': require('../../../assets/rpg-portraits/reveler-male.png'),
  'seraph-female': require('../../../assets/rpg-portraits/seraph-female.png'),
  'seraph-male': require('../../../assets/rpg-portraits/seraph-male.png'),
  'tiderunner-female': require('../../../assets/rpg-portraits/tiderunner-female.png'),
  'tiderunner-male': require('../../../assets/rpg-portraits/tiderunner-male.png'),
  'crimson-regent-male': require('../../../assets/rpg-portraits/crimson-regent-male.png'),
  'archfiend-swimmer-male': require('../../../assets/rpg-portraits/archfiend-swimmer-male.png'),
  'archfiend-swimmer-blackred-male': require('../../../assets/rpg-portraits/archfiend-swimmer-blackred-male.png'),
  'tiderunner-classic-female': require('../../../assets/rpg-portraits/tiderunner-classic-female.png'),
  'tiderunner-classic-male': require('../../../assets/rpg-portraits/tiderunner-classic-male.png'),
};

export function portraitFor(classId: ClassId, gender: Gender, skin = '') {
  const skinNames: Record<string, string> = {
    'crimson-regent': 'crimson-regent-male',
    'archfiend-swimmer': 'archfiend-swimmer-male',
    'archfiend-swimmer-blackred': 'archfiend-swimmer-blackred-male',
    'tiderunner-classic': `tiderunner-classic-${gender}`,
  };
  return portraits[skinNames[skin] || `${classId}-${gender}`];
}
