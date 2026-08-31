import { useAuth } from '@clerk/expo'
import { useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LeaderboardRow } from '../components/leaderboard/LeaderboardRow'
import { LeaderboardSortToggle } from '../components/leaderboard/LeaderboardSortToggle'
import { useLanguage } from '../context/LanguageContext'
import { useLeaderboard, type LeaderboardSort } from '../hooks/useLeaderboard'

// Ported from front/src/pages/Leaderboard.tsx — the ranked list + sort
// toggle. The battles/duel system (BattlesModal, OpponentPicker, the
// Swords button, Battle.tsx itself) is deliberately NOT included yet —
// that's its own real-time dueling mini-game with its own sound/particle
// system, a separate chunk of work from the ranking list itself.
export function LeaderboardScreen() {
  const { userId } = useAuth()
  const { strings } = useLanguage()
  const [sortBy, setSortBy] = useState<LeaderboardSort>('clicks')
  const { leaderboard, isLoading } = useLeaderboard(sortBy)

  return (
    <SafeAreaView className="flex-1 bg-[#08080c]">
      <View className="px-3 pt-2">
        <LeaderboardSortToggle value={sortBy} onChange={setSortBy} />
      </View>

      {!isLoading && leaderboard.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-neutral-500">{strings.leaderboard.empty}</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(entry) => entry.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 100, gap: 8 }}
          renderItem={({ item, index }) => (
            <LeaderboardRow entry={item} rank={index + 1} sortBy={sortBy} isLocalPlayer={item.id === userId} />
          )}
        />
      )}
    </SafeAreaView>
  )
}
