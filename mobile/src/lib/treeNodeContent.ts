import type { useLanguage } from '../context/LanguageContext'
import type { useTreeContext } from '../context/TreeContext'
import { MATERIAL_ABBREVIATIONS } from './materialTiers'

type Strings = ReturnType<typeof useLanguage>['strings']
type Tree = ReturnType<typeof useTreeContext>

export interface NodeStatLine {
  label: string
  value: string
}

export interface NodeModalContent {
  title: string
  description: string
  stats: NodeStatLine[]
}

// front/src/pages/Tree.tsx:49-51, ported verbatim — shared by luckChance,
// anomalyReward, and offlineProduction's current/next chance rows.
function formatChance(chance: number): string {
  return `${(chance * 100).toFixed(1).replace(/\.0$/, '')}%`
}

// Every node's exact title/description/current-next text, ported field for
// field from Tree.tsx's 17 bespoke buy modals (root through offlineProduction
// — c1's premium modal isn't included since GemUpgradesContext isn't ported,
// so it stays a permanently-locked placeholder). Two nodes (legendaryUnlock,
// anomalyUnlock) intentionally have no stat rows at all, matching the web.
export function getNodeModalContent(
  nodeId: string,
  tree: Tree,
  strings: Strings,
  locale: string,
  prestigeTier: number,
): NodeModalContent | null {
  const t = strings.tree
  const currentMaterialName = strings.home.trajectoryTierNames[prestigeTier]
  const cpsUnit = `${MATERIAL_ABBREVIATIONS[prestigeTier]}/s`

  switch (nodeId) {
    case 'root': {
      const maxed = tree.autoClickNextCost === null
      return {
        title: t.autoClickName,
        description: t.autoClickDesc(tree.autoMultiplierValue.toLocaleString(locale, { maximumFractionDigits: 2 }), cpsUnit),
        stats: [
          { label: t.currentRate, value: `${tree.autoClickLevel.toLocaleString(locale)} ${t.dronesUnit}` },
          ...(maxed ? [] : [{ label: t.nextLevelRate, value: `${(tree.autoClickLevel + 1).toLocaleString(locale)} ${t.dronesUnit}` }]),
        ],
      }
    }
    case 'a1': {
      const maxed = tree.luckNextCost === null
      return {
        title: t.luckName,
        description: t.luckDesc,
        stats: [
          { label: t.currentMultiplier, value: `×${tree.luckMultiplier}` },
          ...(maxed ? [] : [{ label: t.nextMultiplier, value: `×${tree.luckMultiplier + 1}` }]),
        ],
      }
    }
    case 'a2': {
      const maxed = tree.luckChanceNextCost === null
      return {
        title: t.luckChanceName,
        description: t.luckChanceDesc,
        stats: [
          { label: t.currentChance, value: formatChance(tree.luckChance) },
          ...(maxed ? [] : [{ label: t.nextChance, value: formatChance(tree.luckChance + 0.01) }]),
        ],
      }
    }
    case 'e1': {
      const maxed = tree.multiplierNextCost === null
      return {
        title: t.multiplierName,
        description: t.multiplierDesc,
        stats: [
          { label: t.currentClickValue, value: `${tree.multiplierValue}` },
          ...(maxed ? [] : [{ label: t.nextClickValue, value: `${tree.multiplierNextValue}` }]),
        ],
      }
    }
    case 'e2a1': {
      const maxed = tree.legendaryGrowthNextCost === null
      return {
        title: t.legendaryGrowthName,
        description: t.legendaryGrowthDesc,
        stats: [
          { label: t.currentBonusStep, value: `+${tree.legendaryBonusStep.toFixed(1)}` },
          ...(maxed ? [] : [{ label: t.nextBonusStep, value: `+${(tree.legendaryBonusStep + 0.1).toFixed(1)}` }]),
        ],
      }
    }
    case 'e2a2': {
      const maxed = tree.legendaryThresholdNextCost === null
      return {
        title: t.legendaryThresholdName,
        description: t.legendaryThresholdDesc,
        stats: [
          { label: t.currentThresholdTps, value: `${tree.legendaryThresholdTps} ${strings.home.tps}` },
          ...(maxed ? [] : [{ label: t.nextThresholdTps, value: `${tree.legendaryThresholdTps - 1} ${strings.home.tps}` }]),
        ],
      }
    }
    case 'e2a0': {
      return {
        title: t.legendaryUnlockName,
        description: t.legendaryUnlockDesc(tree.legendaryThresholdTps.toString()),
        stats: [],
      }
    }
    case 'e2a': {
      const maxed = tree.legendaryEaseNextCost === null
      return {
        title: t.legendaryEaseName,
        description: t.legendaryEaseDesc,
        stats: [
          { label: t.currentStreakClicks, value: `${tree.legendaryStreakBase}` },
          ...(maxed ? [] : [{ label: t.nextStreakClicks, value: `${tree.legendaryStreakBase - 5}` }]),
        ],
      }
    }
    case 'a1b': {
      const maxed = tree.scoutDroneNextCost === null
      return {
        title: t.scoutDroneName,
        description: t.scoutDroneDesc,
        stats: [
          { label: t.scoutDroneCurrentLabel, value: tree.scoutDroneLevel.toLocaleString(locale) },
          ...(maxed ? [] : [{ label: t.scoutDroneNextLabel, value: (tree.scoutDroneLevel + 1).toLocaleString(locale) }]),
        ],
      }
    }
    case 'a1b1': {
      const maxed = tree.scoutFrequencyNextCost === null
      return {
        title: t.scoutFrequencyName,
        description: t.scoutFrequencyDesc,
        stats: [
          { label: t.currentProduction, value: `${tree.scoutDroneRate.toLocaleString(locale, { maximumFractionDigits: 2 })} ${cpsUnit}` },
          ...(maxed
            ? []
            : [{ label: t.nextProduction, value: `${tree.scoutDroneNextRate.toLocaleString(locale, { maximumFractionDigits: 2 })} ${cpsUnit}` }]),
        ],
      }
    }
    case 'e2b': {
      const maxed = tree.autoMultiplierNextCost === null
      return {
        title: t.turboName,
        description: t.turboDesc,
        stats: [
          { label: t.currentProduction, value: `${tree.autoMultiplierValue.toLocaleString(locale, { maximumFractionDigits: 2 })} ${cpsUnit}` },
          ...(maxed
            ? []
            : [{ label: t.nextProduction, value: `${tree.autoMultiplierNextValue.toLocaleString(locale, { maximumFractionDigits: 2 })} ${cpsUnit}` }]),
        ],
      }
    }
    case 'e2c': {
      const maxed = tree.tapMultiplierNextCost === null
      return {
        title: t.tapMultiplierName,
        description: t.tapMultiplierDesc,
        stats: [
          { label: t.currentMultiplier, value: `×${tree.tapMultiplierValue}` },
          ...(maxed ? [] : [{ label: t.nextMultiplier, value: `×${tree.tapMultiplierValue + 1}` }]),
        ],
      }
    }
    case 'b1': {
      const maxed = tree.multiShotNextCost === null
      return {
        title: t.multiShotName,
        description: t.multiShotDesc,
        stats: [
          { label: t.currentMultiShot, value: `${tree.multiShotValue}` },
          ...(maxed ? [] : [{ label: t.nextMultiShot, value: `${tree.multiShotValue + 1}` }]),
        ],
      }
    }
    case 'd1': {
      return {
        title: t.anomalyUnlockName,
        description: t.anomalyUnlockDesc(currentMaterialName),
        stats: [],
      }
    }
    case 'd2': {
      const maxed = tree.anomalyRewardNextCost === null
      return {
        title: t.anomalyRewardName,
        description: t.anomalyRewardDesc(currentMaterialName),
        stats: [
          { label: t.currentAnomalyReward, value: formatChance(tree.anomalyRewardValue) },
          ...(maxed ? [] : [{ label: t.nextAnomalyReward, value: formatChance(tree.anomalyRewardValue + 0.005) }]),
        ],
      }
    }
    case 'd3': {
      const maxed = tree.anomalyFrequencyNextCost === null
      return {
        title: t.anomalyFrequencyName,
        description: t.anomalyFrequencyDesc,
        stats: [
          { label: t.currentAnomalyFrequency, value: t.formatAnomalyWait(tree.anomalyFrequencySeconds) },
          ...(maxed ? [] : [{ label: t.nextAnomalyFrequency, value: t.formatAnomalyWait(Math.max(30, tree.anomalyFrequencySeconds - 30)) }]),
        ],
      }
    }
    case 'e2b1': {
      const maxed = tree.offlineProductionNextCost === null
      return {
        title: t.offlineProductionName,
        description: t.offlineProductionDesc,
        stats: [
          { label: t.currentOfflineProduction, value: formatChance(tree.offlineProductionValue) },
          ...(maxed ? [] : [{ label: t.nextOfflineProduction, value: formatChance(tree.offlineProductionValue + 0.01) }]),
        ],
      }
    }
    default:
      return null
  }
}

// Maxed-state box color per node — Tree.tsx's fallback box isn't uniformly
// red: multiShot is cyan, the three anomaly nodes are orange, and
// offlineProduction is amber (everything else, including root, is red).
export interface MaxedColors {
  border: string
  background: string
  text: string
}

const RED: MaxedColors = { border: 'rgba(248,113,113,0.2)', background: 'rgba(239,68,68,0.07)', text: '#fecaca' }
const CYAN: MaxedColors = { border: 'rgba(34,211,238,0.2)', background: 'rgba(6,182,212,0.07)', text: '#a5f3fc' }
const ORANGE: MaxedColors = { border: 'rgba(251,146,60,0.2)', background: 'rgba(249,115,22,0.07)', text: '#fed7aa' }
const AMBER: MaxedColors = { border: 'rgba(251,191,36,0.2)', background: 'rgba(245,158,11,0.07)', text: '#fde68a' }

const MAXED_COLORS_BY_NODE: Record<string, MaxedColors> = {
  b1: CYAN,
  d1: ORANGE,
  d2: ORANGE,
  d3: ORANGE,
  e2b1: AMBER,
}

export function getMaxedColors(nodeId: string): MaxedColors {
  return MAXED_COLORS_BY_NODE[nodeId] ?? RED
}
