// Match index.html's --font-display, --font-body and --font-stat roles.
// Explicit faces avoid synthesized weights and platform-dependent font lookup.
export const fonts = {
  display: 'Mitr-SemiBold',
  brand: 'Mitr-Bold',
  body: 'IBMPlexSansThai-Regular',
  emphasis: 'IBMPlexSansThai-SemiBold',
  stat: 'ChakraPetch-SemiBold',
  code: 'ChakraPetch-Bold',
} as const;

export const fontAssets = {
  [fonts.display]: require('../../assets/fonts/mitr/Mitr-SemiBold.ttf'),
  [fonts.brand]: require('../../assets/fonts/mitr/Mitr-Bold.ttf'),
  [fonts.body]: require('../../assets/fonts/ibmplexsansthai/IBMPlexSansThai-Regular.ttf'),
  [fonts.emphasis]: require('../../assets/fonts/ibmplexsansthai/IBMPlexSansThai-SemiBold.ttf'),
  [fonts.stat]: require('../../assets/fonts/chakrapetch/ChakraPetch-SemiBold.ttf'),
  [fonts.code]: require('../../assets/fonts/chakrapetch/ChakraPetch-Bold.ttf'),
};
