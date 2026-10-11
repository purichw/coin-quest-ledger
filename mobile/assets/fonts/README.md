# Coin Quest fonts

These unmodified TTF files match the three web typography roles in
`../../../index.html`. Downloaded from the official Google Fonts repository on
2026-10-12; each file was verified against its Git blob SHA during download.

| Web role | Native faces | Source |
| --- | --- | --- |
| Display | Mitr SemiBold (600), Bold (700) | https://github.com/google/fonts/tree/main/ofl/mitr |
| Body | IBM Plex Sans Thai Regular (400), SemiBold (600) | https://github.com/google/fonts/tree/main/ofl/ibmplexsansthai |
| Statistics / codes | Chakra Petch SemiBold (600), Bold (700) | https://github.com/google/fonts/tree/main/ofl/chakrapetch |

Each family includes its original `OFL.txt` license. No fonts were renamed or
modified. Six faces total approximately 820 KB.

`src/theme/typography.ts` maps semantic roles to explicit faces and local asset
references. The root layout loads all six using Expo Font before rendering the
account flow. Files are packaged with the JS assets; no Google Fonts network
request is made at app runtime. Development assets are served by local Metro.
Keep native OS surfaces (keyboard, system alerts) in their platform fonts.
