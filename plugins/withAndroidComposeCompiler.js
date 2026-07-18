const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Ensures the Kotlin Compose compiler plugin is on the Android classpath.
 * Required for widget-bridge (Glance/Compose) under Kotlin 2.0+.
 */
function withAndroidComposeCompiler(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }
    const needle = "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')";
    const line =
      "classpath('org.jetbrains.kotlin:compose-compiler-gradle-plugin')";
    if (
      config.modResults.contents.includes(needle) &&
      !config.modResults.contents.includes(line)
    ) {
      config.modResults.contents = config.modResults.contents.replace(
        needle,
        `${needle}\n    ${line}`,
      );
    }
    return config;
  });
}

module.exports = withAndroidComposeCompiler;
