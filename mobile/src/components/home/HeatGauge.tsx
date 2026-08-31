import { Zap } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'
import { getHeatLevel } from '../../lib/heat'

export function HeatGauge({ clicksPerSecond }: { clicksPerSecond: number }) {
  const { strings } = useLanguage()
  const heat = getHeatLevel(clicksPerSecond)
  const heatLabel = heat.key ? strings.home.heat[heat.key] : null
  const isActive = clicksPerSecond > 0

  return (
    <View className="flex-1 rounded-[3px] border border-white/10 bg-black/30 px-2.5 py-1.5">
      <View className="flex-row items-center gap-1.5">
        <Zap size={11} color={isActive ? heat.icon : '#525252'} />
        <Text className="font-mono text-[8px] font-semibold uppercase tracking-widest text-neutral-500">
          {strings.home.hudHeatLabel}
        </Text>
        {heatLabel && (
          <Text style={{ color: heat.badge }} className="text-[8px] font-bold uppercase tracking-wide">
            {heatLabel}
          </Text>
        )}
      </View>
      <Text style={{ color: isActive ? heat.badge : '#d4d4d4' }} className="mt-0.5 font-mono text-sm font-bold">
        {clicksPerSecond.toFixed(1)} {strings.home.tps}
      </Text>
    </View>
  )
}
