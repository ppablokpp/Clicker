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
 * Google's own test ad units are the default and stay in use until the
 * real ones are set (VITE_ADMOB_REWARDED_ANDROID / _IOS): showing live ads
 * to yourself is the quickest way to have an AdMob account closed, and a
 * brand-new app has no fill anyway.
 */

// The ids Google publishes for exactly this, per platform.
const TEST_REWARDED = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313',
}

function rewardedUnitId(): { id: string; testing: boolean } {
  const ios = nativePlatform() === 'ios'
  const real = (ios ? import.meta.env.VITE_ADMOB_REWARDED_IOS : import.meta.env.VITE_ADMOB_REWARDED_ANDROID) as
    | string
    | undefined
  if (real) return { id: real, testing: false }
  return { id: ios ? TEST_REWARDED.ios : TEST_REWARDED.android, testing: true }
}

/** Thrown when the player closes the ad early; not an error to show. */
export class RewardSkipped extends Error {}

let started: Promise<void> | null = null
function ensureStarted() {
  started ??= AdMob.initialize({
    // Europe needs a consent prompt before a personalised ad, and Google's
    // own form is the supported way to get one; `true` shows it when the
    // rules require it and does nothing where they do not.
    initializeForTesting: false,
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
