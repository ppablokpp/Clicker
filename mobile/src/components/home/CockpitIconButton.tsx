import type { LucideIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

// Ported from front/src/pages/Home.tsx's CockpitIconButton — the small
// square button flanking the platino screen (command center, inventory,
// tasks, log). The LED is a real notification light: lit only when there's
// something new behind that button.
export function CockpitIconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  iconColor,
  ledColor,
  borderColor,
  lit,
}: {
  icon: LucideIcon
  onPress: () => void
  accessibilityLabel: string
  iconColor: string
  ledColor: string
  borderColor: string
  lit: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      className="relative h-9 w-9 items-center justify-center overflow-hidden rounded-[3px] border bg-white/[0.03] active:bg-white/[0.09]"
      style={{ borderColor }}
    >
      {lit && <View className="absolute right-1 top-1 h-1 w-1 rounded-full" style={{ backgroundColor: ledColor }} />}
      <Icon size={15} color={iconColor} />
    </Pressable>
  )
}
