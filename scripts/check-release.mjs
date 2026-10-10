import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const tag = process.env.GITHUB_REF_NAME || process.argv[2];
if (!tag || tag !== `v${version}`) {
  console.error(`Release tag must be v${version}; received ${tag || '(none)'}`);
  process.exit(1);
}
console.log(`Building release ${tag}`);
