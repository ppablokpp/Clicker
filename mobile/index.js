import { registerRootComponent } from 'expo'

import App from './src/App'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App),
// and also ensures the environment is set up appropriately whether running in
// Expo Go, a custom dev client, or a native build.
registerRootComponent(App)
