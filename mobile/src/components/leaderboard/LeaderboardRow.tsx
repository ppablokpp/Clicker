import { Medal, User } from 'lucide-react-native'
import { Image, Text, View } from 'react-native'
import type { LeaderboardEntry, LeaderboardSort } from '../../hooks/useLeaderboard'
import { useLanguage } from '../../context/LanguageContext'

const RANK_STYLES: Record<number, { color: string; border: string; bg: string }> = {
  1: { color: '#fcd34d', border: 'rgba(251,191,36,0.3)', bg: 'rgba(251,191,36,0.1)' },
  2: { color: '#d4d4d4', border: 'rgba(212,212,212,0.3)', bg: 'rgba(212,212,212,0.1)' },
  3: { color: '#fb923c', border: 'rgba(251,146,60,0.3)', bg: 'rgba(251,146,60,0.1)' },
}

// One ranked entry — ported from front/src/pages/Leaderboard.tsx's <li>
// markup. Medal icon for the top 3, plain rank number otherwise.
export function LeaderboardRow({
  entry,
  rank,
  sortBy,
  isLocalPlayer,
}: {
  entry: LeaderboardEntry
  rank: number
  sortBy: LeaderboardSort
  isLocalPlayer: boolean
}) {
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const rankStyle = RANK_STYLES[rank]

  return (
    <View
      className="flex-row items-center gap-3 rounded-xl px-4 py-3"
      style={{
        borderWidth: 1,
        borderColor: isLocalPlayer ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
        backgroundColor: isLocalPlayer ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{
          borderWidth: 1,
          borderColor: rankStyle?.border ?? 'rgba(255,255,255,0.05)',
          backgroundColor: rankStyle?.bg ?? 'rgba(255,255,255,0.03)',
        }}
      >
        {rank <= 3 ? (
          <Medal size={15} color={rankStyle?.color} />
        ) : (
          <Text className="text-sm font-bold text-neutral-400">{rank}</Text>
        )}
      </View>

      {entry.avatarUrl ? (
        <Image source={{ uri: entry.avatarUrl }} className="h-7 w-7 rounded-full" />
      ) : (
        <View className="h-7 w-7 items-center justify-center rounded-full bg-white/5">
          <User size={14} color="#737373" />
        </View>
      )}

      <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
        <Text numberOfLines={1} className={`shrink text-sm font-medium ${isLocalPlayer ? 'text-violet-200' : 'text-neutral-200'}`}>
          {entry.username ?? strings.leaderboard.fallbackName}
        </Text>
        {isLocalPlayer && (
          <View className="rounded-full bg-violet-400/20 px-2 py-0.5">
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">{strings.leaderboard.you}</Text>
          </View>
        )}
      </View>

      <Text className="shrink-0 text-sm font-bold text-neutral-100" style={{ fontVariant: ['tabular-nums'] }}>
        {sortBy === 'cps' ? (
          <>
            {entry.bestCps.toFixed(1)} <Text className="text-xs font-medium opacity-60">t/s</Text>
          </>
        ) : (
          entry.lifetimePlatino.toLocaleString(locale)
        )}
      </Text>
    </View>
  )
}
