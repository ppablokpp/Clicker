import { Text, type TextProps } from 'react-native'

// RN's `Text` is a function component, so the classic `Text.defaultProps`
// trick for a global default font doesn't take effect here — every custom
// font has to be requested explicitly per Text element via `fontFamily`.
// These two wrappers are that: `AppText` for body copy (Inter, matching
// the web's `body { font-family: "Inter" }`), `DisplayText` for the
// headline-style spots the web reserves for Space Grotesk (the platino
// counter, modal titles). A custom `fontFamily` doesn't get synthetically
// bolded by NativeWind's `font-bold` class the way a system font would, so
// `weight` picks the actual matching font file instead.

type InterWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold'

const INTER_FONTS: Record<InterWeight, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
}

export function AppText({ weight = 'regular', style, ...props }: TextProps & { weight?: InterWeight }) {
  return <Text {...props} style={[{ fontFamily: INTER_FONTS[weight] }, style]} />
}

type DisplayWeight = 'medium' | 'semibold' | 'bold'

const SPACE_GROTESK_FONTS: Record<DisplayWeight, string> = {
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
}

export function DisplayText({ weight = 'bold', style, ...props }: TextProps & { weight?: DisplayWeight }) {
  return <Text {...props} style={[{ fontFamily: SPACE_GROTESK_FONTS[weight] }, style]} />
}
