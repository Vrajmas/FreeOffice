import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const types = 'feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert';
const branchPattern = new RegExp(`^(?:${types})/[a-z0-9]+(?:-[a-z0-9]+)*$`);
const subjectPattern = new RegExp(`^(?:${types})(?:\\([a-z0-9][a-z0-9-]*\\))?!?: .+\\S$`);

export function validateBranch(branch) {
  return branchPattern.test(branch);
}

export function validateSubject(subject) {
  return subjectPattern.test(subject);
}

function check(label, value, validate, example) {
  if (validate(value)) return true;
  console.error(`Invalid ${label}: ${JSON.stringify(value)}. Example: ${example}`);
  return false;
}

function main() {
  const title = process.env.PR_TITLE;
  const branch = process.env.PR_BRANCH;
  if (!title || !branch) {
    console.error('PR_TITLE and PR_BRANCH are required');
    process.exitCode = 1;
    return;
  }

  let valid = true;
  valid = check('branch', branch, validateBranch, 'feat/android-build') && valid;
  valid = check('PR title', title, validateSubject, 'feat(android): add APK builds') && valid;

  const subjects = execFileSync('git', ['log', '--no-merges', '--format=%s', 'HEAD^1..HEAD^2'], {
    encoding: 'utf8',
  }).trim().split('\n').filter(Boolean);
  if (subjects.length === 0) {
    console.error('No commits found in the pull request');
    valid = false;
  }
  for (const subject of subjects) {
    valid = check('commit subject', subject, validateSubject, 'fix(editor): preserve document title') && valid;
  }
  if (!valid) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
