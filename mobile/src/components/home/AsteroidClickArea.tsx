import { Pressable, View } from 'react-native'
import { Asteroid } from './Asteroid'
import { ProgressRing } from './ProgressRing'

export function AsteroidClickArea({
  tierIndex,
  pct,
  isMaxed,
  onTap,
}: {
  tierIndex: number
  pct: number
  isMaxed: boolean
  onTap: () => void
}) {
  return (
    <Pressable onPress={onTap} className="flex-1 items-center justify-center">
      <View className="relative h-72 w-72 items-center justify-center">
        <View style={{ position: 'absolute', width: '70%', height: '70%' }}>
          <ProgressRing pct={pct} isMaxed={isMaxed} />
        </View>
        <Asteroid tierIndex={tierIndex} pct={pct} />
      </View>
    </Pressable>
  )
}
