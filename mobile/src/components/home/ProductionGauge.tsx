import { Stone } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'

// `production` is the real total rate — fleet (auto-click + scout drones)
// plus manual tap output — matching front/src/pages/Home.tsx's own header
// formula: `autoClickCps + scoutDroneCps + clicksPerSecond * totalMultiplier`.
export function ProductionGauge({ production, cpsUnit }: { production: number; cpsUnit: string }) {
  const { strings } = useLanguage()
  return (
    <View className="flex-1 rounded-[3px] border border-violet-400/20 bg-violet-500/[0.06] px-2.5 py-1.5">
      <View className="flex-row items-center gap-1.5">
        <Stone size={11} color="#c4b5fd" />
        <Text className="font-mono text-[8px] font-semibold uppercase tracking-widest text-violet-400/70">
          {strings.home.hudProdLabel}
        </Text>
      </View>
      <Text className="mt-0.5 font-mono text-base font-bold text-violet-200">
        {production.toFixed(1)} {cpsUnit}
      </Text>
    </View>
  )
}
