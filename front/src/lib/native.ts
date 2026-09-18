import { Capacitor } from '@capacitor/core'

/**
 * Where the web app is running: in a browser, or inside the native shell
 * (mobile-capacitor/). The same build serves both; the few things that
 * differ inside the app — how you sign in, how you pay — branch on this.
 * In a browser `@capacitor/core` is a tiny stub that answers 'web'.
 */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

export const nativePlatform = (): 'ios' | 'android' | 'web' => Capacitor.getPlatform() as 'ios' | 'android' | 'web'
