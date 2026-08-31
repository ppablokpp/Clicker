import { Stone } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'

export function ProductionGauge({ clicksPerSecond, cpsUnit }: { clicksPerSecond: number; cpsUnit: string }) {
  const { strings } = useLanguage()
  return (
    <View className="flex-1 rounded-[3px] border border-violet-400/20 bg-violet-500/[0.06] px-2.5 py-1.5">
      <View className="flex-row items-center gap-1.5">
        <Stone size={11} color="#c4b5fd" />
        <Text className="font-mono text-[8px] font-semibold uppercase tracking-widest text-violet-400/70">
          {strings.home.hudProdLabel}
        </Text>
      </View>
      <Text className="mt-0.5 font-mono text-sm font-bold text-violet-200">
        {clicksPerSecond.toFixed(1)} {cpsUnit}
      </Text>
    </View>
  )
}
