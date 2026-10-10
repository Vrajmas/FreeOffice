import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function nextVersion(previous, messages) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(previous);
  if (!match) throw new Error(`Invalid release version: ${previous}`);
  let level = 0;
  for (const message of messages) {
    const subject = message.split('\n', 1)[0];
    if (/^[a-z]+(?:\([^)]+\))?!: /.test(subject) || /^BREAKING[ -]CHANGE: /m.test(message)) level = 3;
    else if (/^feat(?:\([^)]+\))?: /.test(subject)) level = Math.max(level, 2);
    else level = Math.max(level, 1);
  }
  if (!level) return null;
  const [major, minor, patch] = match.slice(1).map(Number);
  if (level === 3) return `${major + 1}.0.0`;
  if (level === 2) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function main() {
  const tags = git('tag', '--list', 'v*').split('\n').filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
  const reachable = tags.filter((tag) => {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', tag, 'HEAD'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
  reachable.sort((a, b) => {
    const left = a.slice(1).split('.').map(Number);
    const right = b.slice(1).split('.').map(Number);
    return right[0] - left[0] || right[1] - left[1] || right[2] - left[2];
  });
  const latest = reachable[0];
  const range = latest ? `${latest}..HEAD` : 'HEAD';
  const messages = git('log', '--no-merges', '--format=%B%x00', range).split('\0').map((value) => value.trim()).filter(Boolean);
  const version = nextVersion(latest?.slice(1) ?? '0.0.0', messages);
  if (!version) throw new Error('No changes since the last release');
  console.log(`Release candidate v${version} from ${latest ?? '0.0.0'} (${messages.length} commits)`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
