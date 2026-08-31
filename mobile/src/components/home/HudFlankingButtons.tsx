import { memo } from 'react'
import { ClipboardList, Joystick, Package, Route } from 'lucide-react-native'
import { View } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'
import { CockpitIconButton } from './CockpitIconButton'

// The 4 small buttons flanking the platino screen — mirrors
// front/src/pages/Home.tsx's layout (two stacked on each side). None carry
// a "lit" notification dot yet since those depend on contexts not ported
// to mobile (hasNewUpgrade/hasNewItem/hasClaimableTask/prestige.readyToPrestige).
// Memoized — these never actually need to change while tapping, but were
// getting fully reconciled on every shot regardless since HomeScreen itself
// re-renders per tap. Needs its `onShip`/`onInventory` callback props to
// stay referentially stable (useCallback, not inline arrows) at the call
// site or the memo does nothing — see HomeScreen.tsx.
function HudLeftButtonsImpl({ onShip, onInventory }: { onShip: () => void; onInventory: () => void }) {
  const { strings } = useLanguage()
  return (
    <View className="justify-center gap-2">
      <CockpitIconButton
        icon={Joystick}
        onPress={onShip}
        accessibilityLabel={strings.home.commandCenterTitle}
        iconColor="#c4b5fd"
        ledColor="#a78bfa"
        borderColor="rgba(167,139,250,0.2)"
        lit={false}
      />
      <CockpitIconButton
        icon={Package}
        onPress={onInventory}
        accessibilityLabel={strings.home.inventory}
        iconColor="#fcd34d"
        ledColor="#fbbf24"
        borderColor="rgba(251,191,36,0.2)"
        lit={false}
      />
    </View>
  )
}

export const HudLeftButtons = memo(HudLeftButtonsImpl)

function HudRightButtonsImpl({
  onTasks,
  onLog,
  hasClaimableTask = false,
}: {
  onTasks: () => void
  onLog: () => void
  hasClaimableTask?: boolean
}) {
  const { strings } = useLanguage()
  return (
    <View className="justify-center gap-2">
      <CockpitIconButton
        icon={ClipboardList}
        onPress={onTasks}
        accessibilityLabel={strings.home.tasks}
        iconColor="#6ee7b7"
        ledColor="#34d399"
        borderColor="rgba(52,211,153,0.2)"
        lit={hasClaimableTask}
      />
      <CockpitIconButton
        icon={Route}
        onPress={onLog}
        accessibilityLabel={strings.home.log}
        iconColor="#7dd3fc"
        ledColor="#38bdf8"
        borderColor="rgba(56,189,248,0.2)"
        lit={false}
      />
    </View>
  )
}

export const HudRightButtons = memo(HudRightButtonsImpl)
