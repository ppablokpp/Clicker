import { Check, Medal, Stone } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'
import type { Mission } from '../../hooks/useMissions'
import { MATERIAL_TIER_COLORS } from '../../lib/materialTiers'
import { AppText } from '../AppText'

const MEDAL_COLORS = ['#a9784a', '#d4d4d4', '#facc15', '#a5f3fc']

// One mission's card inside the Tasks modal — index tab, icon+name+progress
// bar, a row of 3 medal badges to browse tiers (bronze/silver/gold, same
// interaction as Stats' own milestones), and a claim/locked/claimed pill
// for whichever tier is currently selected. Ported from
// front/src/pages/Home.tsx's inline mission-card JSX.
export function MissionCard({
  mission,
  index,
  currentMaterialTierIndex,
  claimedTasks,
  claimingTaskId,
  onClaim,
}: {
  mission: Mission
  index: number
  currentMaterialTierIndex: number
  claimedTasks: Set<string>
  claimingTaskId: string | null
  onClaim: (taskId: string) => void
}) {
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [selectedTierIdx, setSelectedTierIdx] = useState<number | null>(null)

  const allTiersClaimed = mission.tiers.every((tier) => claimedTasks.has(tier.id))
  const activeTierIdx = mission.tiers.findIndex((tier) => !claimedTasks.has(tier.id))
  const shownTierIdx = selectedTierIdx ?? (activeTierIdx === -1 ? mission.tiers.length - 1 : activeTierIdx)
  const selectedTier = mission.tiers[shownTierIdx]
  const pct = allTiersClaimed ? 100 : Math.min(1, mission.progressValue / selectedTier.required) * 100

  const Icon = mission.icon
  const isClaimed = claimedTasks.has(selectedTier.id)
  const isClaiming = claimingTaskId === selectedTier.id
  const isCompleted = mission.progressValue >= selectedTier.required
  const tierColor = MATERIAL_TIER_COLORS[currentMaterialTierIndex] ?? MATERIAL_TIER_COLORS[0]

  return (
    <View
      className="flex-row overflow-hidden rounded-lg border border-white/5"
      style={{ backgroundColor: allTiersClaimed ? 'rgba(13,13,19,0.5)' : '#0d0d13', opacity: allTiersClaimed ? 0.5 : 1 }}
    >
      <View className="w-7 items-center justify-center" style={{ backgroundColor: mission.badgeColor }}>
        <Text
          className="font-mono text-[9px] font-bold tracking-widest text-neutral-300"
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          M-0{index + 1}
        </Text>
      </View>

      <View className="flex-1 gap-2.5 px-3.5 py-3">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: mission.badgeColor }}>
            <Icon size={19} color="#e5e5e5" />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <AppText weight="semibold" className="text-sm text-white">
              {mission.missionName}
            </AppText>
            <Text className="text-xs text-neutral-500">
              {allTiersClaimed ? strings.home.tasksAllClaimed : selectedTier.desc}
            </Text>
            <View className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <View className="h-full rounded-full bg-violet-400" style={{ width: `${pct}%` }} />
            </View>
            <Text className="mt-0.5 text-right font-mono text-[10px] text-neutral-500">
              {(allTiersClaimed ? selectedTier.required : Math.min(mission.progressValue, selectedTier.required)).toLocaleString(locale)}
              /{selectedTier.required.toLocaleString(locale)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-3">
          {mission.tiers.map((tier, tierIdx) => {
            const reached = mission.progressValue >= tier.required
            const isSelected = shownTierIdx === tierIdx
            return (
              <Pressable
                key={tier.id}
                onPress={() => setSelectedTierIdx(tierIdx)}
                accessibilityLabel={tier.name}
                className="h-7 w-7 items-center justify-center rounded-full border"
                style={{
                  borderColor: isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <Medal size={14} color={reached ? MEDAL_COLORS[tierIdx] : '#404040'} />
              </Pressable>
            )
          })}
        </View>

        <View className="flex-row items-center gap-2">
          <View className="h-0 flex-1 border-t border-dashed border-white/15" />
          <Text className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-widest text-neutral-600">
            {strings.home.tasksRewardsLabel}
          </Text>
          <View className="h-0 flex-1 border-t border-dashed border-white/15" />
        </View>

        <View className="items-center">
          {isClaimed ? (
            <View className="flex-row items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 opacity-70">
              <Check size={13} color="#6ee7b7" />
              <Stone size={13} color="#6ee7b7" />
              <Text className="text-xs font-semibold text-emerald-300">{selectedTier.reward.toLocaleString(locale)}</Text>
            </View>
          ) : isCompleted ? (
            <Pressable
              onPress={() => onClaim(selectedTier.id)}
              disabled={isClaiming}
              className="flex-row items-center gap-1 rounded-full px-2.5 py-1.5"
              style={{
                borderWidth: 1,
                borderColor: tierColor.glow,
                backgroundColor: `${tierColor.dark}55`,
                opacity: isClaiming ? 0.6 : 1,
              }}
            >
              <Stone size={13} color={tierColor.light} />
              <Text className="text-xs font-bold" style={{ color: tierColor.light }}>
                {isClaiming ? strings.home.taskClaiming : selectedTier.reward.toLocaleString(locale)}
              </Text>
            </Pressable>
          ) : (
            <View
              className="flex-row items-center gap-1 rounded-full px-2.5 py-1.5"
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              <Stone size={13} color="#525252" />
              <Text className="text-xs font-semibold text-neutral-600">{selectedTier.reward.toLocaleString(locale)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
