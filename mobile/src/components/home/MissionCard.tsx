import { LinearGradient } from 'expo-linear-gradient'
import { Check, Medal, Stone } from 'lucide-react-native'
import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'
import type { Mission } from '../../hooks/useMissions'
import { MATERIAL_PILL_COLORS } from '../../lib/materialTiers'
import { AppText } from '../AppText'
import { DashedLine } from '../DashedLine'
import { IconBadge } from '../IconBadge'

// bronze / silver / gold / platinum — same MILESTONE_TIER_COLORS the web's
// Stats page uses for these same rank badges.
const MEDAL_COLORS = ['#a9784a', '#d4d4d4', '#facc15', '#a5f3fc']
const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })

// One mission's card inside the Tasks modal — index tab, icon+name+progress
// bar, a row of 3 medal badges to browse tiers (bronze/silver/gold, same
// interaction as Stats' own milestones), and a claim/locked/claimed pill
// for whichever tier is currently selected. Ported from
// front/src/pages/Home.tsx's inline mission-card JSX.
//
// Every value here is a plain inline `style` object, deliberately not a
// Tailwind `className` — several individual utilities on this specific
// component (a percentage-width progress fill, `text-right`, a `rotate`
// transform, standard `px-3.5`-style padding) rendered as if they weren't
// applied at all, on a component where nothing else about the setup
// differs from other screens where the same utilities work fine. Rather
// than keep chasing which one NativeWind is choking on here, everything
// layout/color-relevant in this file is inline, which has no equivalent
// failure mode.
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
  const pillColors = MATERIAL_PILL_COLORS[currentMaterialTierIndex] ?? MATERIAL_PILL_COLORS[0]

  return (
    <View
      style={{
        flexDirection: 'row',
        overflow: 'hidden',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: allTiersClaimed ? 'rgba(13,13,19,0.8)' : '#0d0d13',
        opacity: allTiersClaimed ? 0.5 : 1,
      }}
    >
      <View style={{ width: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: mission.badgeBg }}>
        {/* Rotating a View wrapping the Text, not the Text itself — RN
            transforms are unambiguously reliable on View; on this Text
            specifically the rotation just never visually took, wrapped or
            not clipped by anything obvious. */}
        <View style={{ transform: [{ rotate: '-90deg' }] }}>
          <Text
            style={{
              fontFamily: MONO_FONT,
              fontSize: 9,
              fontWeight: '700',
              letterSpacing: 1,
              color: mission.badgeText,
            }}
          >
            M-0{index + 1}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, gap: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconBadge
            icon={<Icon size={19} color={mission.badgeText} />}
            iconSize={19}
            padding={9}
            background={mission.badgeBg}
            rounded={8}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <AppText weight="semibold" style={{ fontSize: 14, color: '#fff' }}>
              {mission.missionName}
            </AppText>
            <Text style={{ fontSize: 12, color: '#737373' }}>
              {allTiersClaimed ? strings.home.tasksAllClaimed : selectedTier.desc}
            </Text>
            <View
              style={{
                marginTop: 2,
                height: 4,
                width: '100%',
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <LinearGradient
                colors={['#8b5cf6', '#e879f9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: '100%', width: `${pct}%`, borderRadius: 999 }}
              />
            </View>
            <Text
              style={{
                marginTop: 2,
                width: '100%',
                textAlign: 'right',
                fontFamily: MONO_FONT,
                fontSize: 10,
                color: '#737373',
              }}
            >
              {(allTiersClaimed ? selectedTier.required : Math.min(mission.progressValue, selectedTier.required)).toLocaleString(locale)}
              /{selectedTier.required.toLocaleString(locale)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {mission.tiers.map((tier, tierIdx) => {
            const reached = mission.progressValue >= tier.required
            const isSelected = shownTierIdx === tierIdx
            return (
              <Pressable key={tier.id} onPress={() => setSelectedTierIdx(tierIdx)} accessibilityLabel={tier.name}>
                <IconBadge
                  icon={<Medal size={14} color={reached ? MEDAL_COLORS[tierIdx] : '#404040'} />}
                  iconSize={14}
                  padding={7}
                  background={isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'}
                  borderColor={isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)'}
                />
              </Pressable>
            )
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <DashedLine />
          <Text
            style={{
              flexShrink: 0,
              fontFamily: MONO_FONT,
              fontSize: 8,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#525252',
            }}
          >
            {strings.home.tasksRewardsLabel}
          </Text>
          <DashedLine />
        </View>

        <View style={{ alignItems: 'center' }}>
          {isClaimed ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: 'rgba(52,211,153,0.3)',
                backgroundColor: 'rgba(16,185,129,0.1)',
                opacity: 0.7,
              }}
            >
              <Check size={13} color="#6ee7b7" />
              <Stone size={13} color="#6ee7b7" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6ee7b7' }}>{selectedTier.reward.toLocaleString(locale)}</Text>
            </View>
          ) : isCompleted ? (
            <Pressable
              onPress={() => onClaim(selectedTier.id)}
              disabled={isClaiming}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: pillColors.border,
                backgroundColor: pillColors.background,
                opacity: isClaiming ? 0.6 : 1,
              }}
            >
              <Stone size={13} color={pillColors.text} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: pillColors.text }}>
                {isClaiming ? strings.home.taskClaiming : selectedTier.reward.toLocaleString(locale)}
              </Text>
            </Pressable>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(255,255,255,0.02)',
              }}
            >
              <Stone size={13} color="#525252" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#525252' }}>{selectedTier.reward.toLocaleString(locale)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
