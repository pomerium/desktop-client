const { notarize } = require('@electron/notarize');
const { build } = require('../../package.json');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (!process.env.CI) {
    console.warn('Skipping notarizing step. Packaging is not running in CI');
    return;
  }

  if (
    !('APPLE_ID' in process.env && 'APPLE_ID_PASS' in process.env) &&
    !('APPLE_ID' in process.env && 'APPLE_ID_KEY_ISSUER' in process.env)
  ) {
    console.warn(
      'Skipping notarizing step. APPLE_ID and APPLE_ID_PASS or APPLE_ID_KEY_ISSUER env variables must be set'
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  // Password based auth
  if ('APPLE_ID_PASS' in process.env) {
    await notarize({
      appBundleId: build.appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASS,
    });
    // API key based auth
  } else {
    await notarize({
      appBundleId: build.appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleApiKey: process.env.APPLE_ID,
      appleApiIssuer: process.env.APPLE_ID_KEY_ISSUER,
    });
  }
};
