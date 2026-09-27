import UIKit
import Capacitor

/// The shell, full screen the way games are: no status bar. The plist asks
/// for it too (UIStatusBarHidden), but with
/// UIViewControllerBasedStatusBarAppearance on it is the view controller
/// that decides, so the word has to be given here — and this controller has
/// to be the one actually on screen, which is why SceneDelegate builds this
/// class and not CAPBridgeViewController.
///
/// The home indicator stays. `prefersHomeIndicatorAutoHidden` is not `open`
/// in the iOS 26 SDK, so a subclass outside UIKit cannot override it at all
/// ("overriding non-open property outside of its defining module"), and iOS
/// offers no other way to dim it. It was never removable anyway — at most
/// it faded after a few still seconds.
class ClankUpViewController: CAPBridgeViewController {
    override var prefersStatusBarHidden: Bool { true }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
