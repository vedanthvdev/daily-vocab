/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'DailyVocabWidget',
  displayName: 'Daily Vocab',
  deploymentTarget: '17.0',
  bundleIdentifier: '.DailyVocabWidget',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    $accent: {
      light: '#8FBF9A',
      dark: '#A8D4B4',
    },
    $widgetBackground: {
      light: '#E6EDE0E6',
      dark: '#1F2824E0',
    },
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios?.entitlements?.['com.apple.security.application-groups'] ?? [
        'group.com.dailyvocab.app',
      ],
  },
});
