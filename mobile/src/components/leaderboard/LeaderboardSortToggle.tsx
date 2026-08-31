import { Stone, Zap } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'
import type { LeaderboardSort } from '../../hooks/useLeaderboard'

// The clicks/cps segmented toggle pill floating at the top of the
// Leaderboard — ported from front/src/pages/Leaderboard.tsx's fixed pill.
export function LeaderboardSortToggle({ value, onChange }: { value: LeaderboardSort; onChange: (v: LeaderboardSort) => void }) {
  const { strings } = useLanguage()
  return (
    <View
      className="flex-row items-center self-center rounded-full p-1"
      style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(13,13,20,0.9)' }}
    >
      <Pressable
        onPress={() => onChange('clicks')}
        accessibilityLabel={strings.leaderboard.clicksTab}
        className="h-9 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: value === 'clicks' ? '#fff' : 'transparent' }}
      >
        <Stone size={19} color={value === 'clicks' ? '#171717' : '#737373'} />
      </Pressable>
      <Pressable
        onPress={() => onChange('cps')}
        accessibilityLabel={strings.leaderboard.cpsTab}
        className="h-9 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: value === 'cps' ? '#fff' : 'transparent' }}
      >
        <Zap size={16} color={value === 'cps' ? '#171717' : '#737373'} />
      </Pressable>
    </View>
  )
}
