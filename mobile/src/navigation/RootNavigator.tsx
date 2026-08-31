import { Show } from '@clerk/expo'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useLanguage } from '../context/LanguageContext'
import { BottomNavPill } from './BottomNavPill'
import { HomeScreen } from '../screens/HomeScreen'
import { LeaderboardScreen } from '../screens/LeaderboardScreen'
import { PlaceholderScreen } from '../screens/PlaceholderScreen'
import { SignInScreen } from '../screens/SignInScreen'
import { TreeScreen } from '../screens/TreeScreen'

// Exact 5-tab set/order from the web app's BottomNavPill.tsx: Tree ->
// Leaderboard -> Home (default) -> Stats -> Store. Screens are placeholders
// for now, swapped in one at a time per the build-order phases (Home first,
// Leaderboard and Tree now real too).
const Tab = createBottomTabNavigator()

function StatsScreen() {
  const { strings } = useLanguage()
  return <PlaceholderScreen label={strings.nav.stats} />
}
function StoreScreen() {
  const { strings } = useLanguage()
  return <PlaceholderScreen label={strings.nav.store} />
}

function MainTabs() {
  const { strings } = useLanguage()
  return (
    <Tab.Navigator
      initialRouteName="Home"
      // Without this, React Navigation's own scene container defaults to a
      // white background — invisible normally (each screen's own root View
      // paints over it), but it's what actually shows through the gap during
      // a ScrollView/FlatList's overscroll bounce (Leaderboard's list,
      // Store/Stats) instead of the screen's own dark bg-color, since that
      // gap is *behind* the scroll content, not part of it.
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#08080c' } }}
      tabBar={(props) => <BottomNavPill {...props} />}
    >
      <Tab.Screen name="Tree" component={TreeScreen} options={{ title: strings.nav.tree }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: strings.nav.leaderboard }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: strings.nav.home }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: strings.nav.stats }} />
      <Tab.Screen name="Store" component={StoreScreen} options={{ title: strings.nav.store }} />
    </Tab.Navigator>
  )
}

// Replaces the web version's AuthGate.tsx — <Show when="signed-in"> is Core
// 3's replacement for the old <SignedIn>/<SignedOut> pair, rendering the
// main app once authenticated and the sign-in screen otherwise via `fallback`.
export function RootNavigator() {
  return (
    <Show when="signed-in" fallback={<SignInScreen />}>
      <MainTabs />
    </Show>
  )
}
