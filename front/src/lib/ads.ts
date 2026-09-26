import { AdMob, type RewardAdOptions } from '@capacitor-community/admob'
import { isNativeApp, nativePlatform } from './native'

/**
 * Rewarded ads: watch one, get a key. Only inside the app — there is no
 * AdMob on the web.
 *
 * Nothing here grants anything. The key comes from AdMob's own callback to
 * the back (see back/src/routes/ads.js), which is why the player's id
 * travels with the request as `ssv.customData`: it is how that callback
 * knows whose key it is. When the ad closes, the app just re-reads its
 * keys and finds the new one.
 *
 * Nothing is live until VITE_ADMOB_LIVE is 'true': every request until
 * then is a test request, because showing live ads to yourself (or to a
 * handful of testers) is the quickest way to have an AdMob account flagged
 * for invalid traffic.
 *
 * A test request is *not* the same as Google's demo ad unit, and the
 * difference is the whole reason the reward used to never arrive. Google's
 * demo units belong to Google: they have no server-side verification URL,
 * so no callback ever reaches the back and no key is ever granted. Our own
 * unit does have one — so on a device listed in VITE_ADMOB_TEST_DEVICES the
 * request goes to our unit (Google still serves a test ad, since the device
 * is registered) and the callback fires exactly as it will in production.
 * Every other device falls back to the demo unit: safe, but rewardless.
 */

// The ids Google publishes for exactly this, per platform.
const DEMO_REWARDED = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313',
}

/**
 * Devices Google should treat as test devices: our own phones, by the
 * hashed advertising id the SDK prints in the log on the first ad request
 * ("Use ... setTestDeviceIds(Arrays.asList("ABC123"))..."). Comma-separated.
 */
const TEST_DEVICES = String(import.meta.env.VITE_ADMOB_TEST_DEVICES ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

/** Real ads, for real money. Only on release day. */
const LIVE = import.meta.env.VITE_ADMOB_LIVE === 'true'

function rewardedUnitId(): { id: string; testing: boolean } {
  const ios = nativePlatform() === 'ios'
  const ours = (ios ? import.meta.env.VITE_ADMOB_REWARDED_IOS : import.meta.env.VITE_ADMOB_REWARDED_ANDROID) as
    | string
    | undefined
  // With `isTesting` the plugin swaps in Google's demo unit — unless the
  // device is a registered test device, in which case it keeps ours and
  // Google serves a test ad through it. That is the combination that lets
  // the callback be tested without ever serving a live ad.
  if (ours) return { id: ours, testing: !LIVE }
  return { id: ios ? DEMO_REWARDED.ios : DEMO_REWARDED.android, testing: true }
}

/** Thrown when the player closes the ad early; not an error to show. */
export class RewardSkipped extends Error {}

let started: Promise<unknown> | null = null
function ensureStarted(): Promise<unknown> {
  started ??= (async () => {
    // iOS asks before an app may read the advertising identifier. Ask
    // first, then start: AdMob reads the answer when it initialises, and
    // a refusal only means non-personalised ads.
    if (nativePlatform() === 'ios') {
      try {
        const { status } = await AdMob.trackingAuthorizationStatus()
        if (status === 'notDetermined') await AdMob.requestTrackingAuthorization()
      } catch (err) {
        console.warn('No se pudo pedir el permiso de seguimiento', err)
      }
    }
    return AdMob.initialize({
      // Europe needs a consent prompt before a personalised ad, and Google's
      // own form is the supported way to get one; `true` shows it when the
      // rules require it and does nothing where they do not.
      // What registers our own phones with the SDK, so a request to our own
      // ad unit comes back as a test ad instead of a live one.
      initializeForTesting: TEST_DEVICES.length > 0,
      testingDevices: TEST_DEVICES,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    }).then(async () => {
      try {
        const info = await AdMob.requestConsentInfo()
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
          await AdMob.showConsentForm()
        }
      } catch (err) {
        // No consent form is not a reason to refuse the ad: Google falls back
        // to a non-personalised one.
        console.warn('No se pudo mostrar el formulario de consentimiento', err)
      }
    })
  })()
  return started
}

/** Whether the button should be there at all. */
export const adsAvailable = (): boolean => isNativeApp()

/**
 * Shows one rewarded ad and resolves when it has been watched through.
 * Resolving means the phone saw the reward event — the key itself lands
 * when AdMob's callback reaches the back, a second or two later, which is
 * why the caller re-reads its keys rather than trusting a return value.
 */
export async function showRewardedAd(userId: string): Promise<void> {
  if (!isNativeApp()) throw new Error('Los anuncios solo están en la app')
  await ensureStarted()

  const { id, testing } = rewardedUnitId()
  const options: RewardAdOptions = {
    adId: id,
    isTesting: testing,
    // What tells the callback whose key this is.
    ssv: { customData: userId },
  }

  await AdMob.prepareRewardVideoAd(options)
  const reward = await AdMob.showRewardVideoAd()
  // Closing early resolves with nothing rewarded; Google has not called the
  // back either, so there is no key and nothing to undo.
  if (!reward || !reward.amount) throw new RewardSkipped()
}
