import { colors } from '../auth/ui';
import { fonts } from '../theme/typography';

export const playerStackOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: fonts.display },
  headerTintColor: colors.green,
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: colors.background },
};

export const scenicStackOptions = {
  headerStyle: { backgroundColor: '#193c30' },
  headerTintColor: '#fff2d3',
};
