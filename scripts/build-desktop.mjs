import { build, Platform } from 'electron-builder';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const kind = process.env.OFFICE_KIND;
if (!['doc', 'sheet'].includes(kind)) throw new Error('Set OFFICE_KIND to doc or sheet');
const platform = process.platform;
if (!['darwin', 'win32'].includes(platform)) throw new Error('Desktop installers require macOS or Windows');
const name = kind === 'doc' ? 'Personal Documents' : 'Personal Spreadsheets';
const appId = `local.personaloffice.${kind === 'doc' ? 'documents' : 'spreadsheets'}`;
const version = JSON.parse((await import('node:fs')).readFileSync('package.json', 'utf8')).version;
process.env.ELECTRON_BUILDER_CACHE ||= path.resolve('.cache/electron-builder');
process.env.ELECTRON_CACHE ||= path.resolve('.cache/electron');
const stage = path.resolve('.build', `desktop-${kind}`);
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this script with npm run build:desktop');
rmSync(stage, { recursive: true, force: true });
mkdirSync(path.join(stage, 'electron'), { recursive: true });
execFileSync(process.execPath, [npmCli, 'run', 'build', '--', '--outDir', path.join(stage, 'dist')], {
  stdio: 'inherit', env: { ...process.env, VITE_APP_KIND: kind },
});
cpSync('electron/main.cjs', path.join(stage, 'electron/main.cjs'));
cpSync('electron/preload.cjs', path.join(stage, 'electron/preload.cjs'));
writeFileSync(path.join(stage, 'package.json'), JSON.stringify({
  name: `personal-${kind}`, productName: name, version,
  main: 'electron/main.cjs', officeKind: kind,
}));
await build({
  targets: platform === 'darwin' ? Platform.MAC.createTarget('dmg') : Platform.WINDOWS.createTarget('nsis'),
  config: {
    appId, productName: name,
    directories: { app: stage, output: path.resolve('releases') },
    files: ['dist/**/*', 'electron/**/*', 'package.json'],
    fileAssociations: [{ ext: kind === 'doc' ? 'docx' : 'xlsx',
      name: kind === 'doc' ? 'Word document' : 'Excel workbook', role: 'Editor' }],
    asar: true,
    mac: { icon: path.resolve(`assets/${kind}.icns`), identity: null, target: 'dmg' },
    win: { target: 'nsis' },
    nsis: { oneClick: false, allowToChangeInstallationDirectory: true },
    artifactName: `${name.replaceAll(' ', '-')}-${'${version}'}-${'${arch}'}.${'${ext}'}`,
  },
});
