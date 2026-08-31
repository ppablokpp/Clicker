import { Show } from '@clerk/expo'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BarChart3, Network, Rocket, Store as StoreIcon, Trophy } from 'lucide-react-native'
import { useLanguage } from '../context/LanguageContext'
import { HomeScreen } from '../screens/HomeScreen'
import { PlaceholderScreen } from '../screens/PlaceholderScreen'
import { SignInScreen } from '../screens/SignInScreen'

// Exact 5-tab set/order from the web app's BottomNavPill.tsx: Tree ->
// Leaderboard -> Home (default) -> Stats -> Store. Screens are placeholders
// for now, swapped in one at a time per the build-order phases (Home first).
const Tab = createBottomTabNavigator()

function TreeScreen() {
  const { strings } = useLanguage()
  return <PlaceholderScreen label={strings.nav.tree} />
}
function LeaderboardScreen() {
  const { strings } = useLanguage()
  return <PlaceholderScreen label={strings.nav.leaderboard} />
}
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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#c4b5fd',
        tabBarInactiveTintColor: '#737373',
        tabBarStyle: { backgroundColor: '#0a0a10', borderTopColor: 'rgba(255,255,255,0.1)' },
      }}
    >
      <Tab.Screen
        name="Tree"
        component={TreeScreen}
        options={{ title: strings.nav.tree, tabBarIcon: ({ color, size }) => <Network color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: strings.nav.leaderboard, tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: strings.nav.home, tabBarIcon: ({ color, size }) => <Rocket color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: strings.nav.stats, tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{ title: strings.nav.store, tabBarIcon: ({ color, size }) => <StoreIcon color={color} size={size} /> }}
      />
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
