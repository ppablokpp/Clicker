import type { ReactNode } from 'react'
import { View } from 'react-native'
import { AppText } from '../AppText'

// One stat tile inside the Command Center modal — icon badge + title +
// whatever description lines the caller passes in. Ported from the
// repeated `rounded-xl border ... p-3.5` card markup in
// front/src/pages/Home.tsx's showShip panel.
export function ShipStatCard({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: ReactNode
  iconBg: string
  title: string
  children: ReactNode
}) {
  return (
    <View className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
      <View className="mb-1.5 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>
          {icon}
        </View>
        <AppText weight="semibold" className="text-sm text-white">
          {title}
        </AppText>
      </View>
      {children}
    </View>
  )
}

export function ShipStatLine({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <AppText className="text-xs text-neutral-400">
      {label} <AppText weight="semibold" className="text-xs text-white">{value}</AppText>
      {unit ? ` ${unit}` : ''}
    </AppText>
  )
}
