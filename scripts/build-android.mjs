import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const kind = process.env.OFFICE_KIND;
if (!['doc', 'sheet'].includes(kind)) throw new Error('Set OFFICE_KIND to doc or sheet');
const name = kind === 'doc' ? 'Personal Documents' : 'Personal Spreadsheets';
const stage = path.resolve('.build', `android-${kind}`);
const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
const version = rootPackage.version;
const [major, minor, patch] = version.split('.').map(Number);
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this script with npm run build:android');
const versionCode = major * 1000000 + minor * 1000 + patch;
if (!Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error('Invalid Android version code');
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
const { writeFileSync } = await import('node:fs');
writeFileSync(path.join(stage, 'package.json'), JSON.stringify({
  name: `personal-${kind}-android`, version, private: true,
  dependencies: Object.fromEntries(Object.entries(rootPackage.dependencies)
    .filter(([key]) => key.startsWith('@capacitor/'))),
}));
execFileSync(process.execPath, [npmCli, 'run', 'build', '--', '--outDir', path.join(stage, 'dist')], {
  stdio: 'inherit', env: { ...process.env, VITE_APP_KIND: kind },
});
const config = JSON.stringify({
  appId: `com.vrajmas.freeoffice.${kind}`, appName: name, webDir: 'dist',
});
writeFileSync(path.join(stage, 'capacitor.config.json'), config);
const cap = path.resolve('node_modules/@capacitor/cli/bin/capacitor');
execFileSync(process.execPath, [cap, 'add', 'android'], { cwd: stage, stdio: 'inherit' });
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdk) throw new Error('Set ANDROID_HOME or ANDROID_SDK_ROOT to the Android SDK');
writeFileSync(path.join(stage, 'android/local.properties'), `sdk.dir=${sdk}\n`);
const gradle = path.join(stage, 'android/app/build.gradle');
let source = readFileSync(gradle, 'utf8');
source = source.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
writeFileSync(gradle, source);
execFileSync(path.join(stage, 'android/gradlew'), ['assembleDebug'], {
  cwd: path.join(stage, 'android'), stdio: 'inherit',
});
const apk = path.join(stage, 'android/app/build/outputs/apk/debug/app-debug.apk');
if (!existsSync(apk)) throw new Error('Android build produced no APK');
mkdirSync('releases', { recursive: true });
cpSync(apk, path.join('releases', `${name.replaceAll(' ', '-')}-${version}-android-debug.apk`));
