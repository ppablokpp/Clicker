import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Stand-in for a screen not built yet — swapped out one at a time as each
// phase of the port lands (see the plan: Home first, then Store/Stats,
// then Leaderboard/Battle, Tree last).
export function PlaceholderScreen({ label }: { label: string }) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#08080c]">
      <Text className="text-sm text-neutral-500">{label}</Text>
    </SafeAreaView>
  )
}
