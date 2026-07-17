/**
 * Expo config plugin: adopt UIKit scene lifecycle for iOS 27+ SDK.
 *
 * Without UIApplicationSceneManifest + SceneDelegate, apps built with Xcode 27
 * trap at launch (UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption).
 */
const {
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
  IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SCENE_STARTUP_COMMENT = `// Window + React Native are started from SceneDelegate under the
    // scene-based life cycle required by the iOS 27 SDK.
`;

const SCENE_DELEGATE_SOURCE = `internal import Expo
internal import ExpoModulesCore
import React
import UIKit

/**
 UIScene lifecycle entry point required by the iOS 27 SDK.
 Without this, UIKit traps at launch with UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption.
 */
@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory
    else {
      assertionFailure("SceneDelegate: AppDelegate is missing reactNativeFactory")
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptionsForScene
    )

    for context in connectionOptions.urlContexts {
      _ = RCTLinkingManager.application(
        UIApplication.shared,
        open: context.url,
        options: [:]
      )
    }
  }

  func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(UIApplication.shared)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = RCTLinkingManager.application(
        UIApplication.shared,
        open: context.url,
        options: [:]
      )
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
`;

function stripAppDelegateStartup(src) {
  let next = src;

  if (/#if os\(iOS\) \|\| os\(tvOS\)[\s\S]*?#endif/.test(next)) {
    next = next.replace(/#if os\(iOS\) \|\| os\(tvOS\)[\s\S]*?#endif\n?/, SCENE_STARTUP_COMMENT);
  } else if (/factory\.startReactNative\(/.test(next)) {
    next = next.replace(/[ \t]*factory\.startReactNative\([\s\S]*?\)\n/, `    ${SCENE_STARTUP_COMMENT}`);
  }

  if (/startReactNative/.test(next)) {
    throw new Error(
      'withIosSceneLifecycle: AppDelegate.swift still calls startReactNative after patch',
    );
  }

  if (!/launchOptionsForScene/.test(next)) {
    next = next.replace(
      /(public class AppDelegate:[^\n]+\{\n)/,
      `$1  /// Captured for SceneDelegate React Native startup.\n  var launchOptionsForScene: [UIApplication.LaunchOptionsKey: Any]?\n\n`,
    );
    next = next.replace(
      /(didFinishLaunchingWithOptions launchOptions:[^\n]+\{)/,
      `$1\n    launchOptionsForScene = launchOptions`,
    );
  }

  return next;
}

function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const projectName = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
      const appDir = path.join(projectRoot, projectName);

      fs.writeFileSync(path.join(appDir, 'SceneDelegate.swift'), SCENE_DELEGATE_SOURCE);

      const appDelegatePath = path.join(appDir, 'AppDelegate.swift');
      if (fs.existsSync(appDelegatePath)) {
        const src = fs.readFileSync(appDelegatePath, 'utf8');
        fs.writeFileSync(appDelegatePath, stripAppDelegateStartup(src));
      }

      return cfg;
    },
  ]);

  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
    const filePath = `${projectName}/SceneDelegate.swift`;
    if (!project.hasFile(filePath)) {
      const appTarget = project.getFirstTarget();
      project.addSourceFile(filePath, {}, appTarget?.uuid);
    }
    return cfg;
  });

  return config;
}

module.exports = withIosSceneLifecycle;
module.exports.stripAppDelegateStartup = stripAppDelegateStartup;
