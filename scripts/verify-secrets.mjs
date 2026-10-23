import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => !f.endsWith('.pdf') && !f.endsWith('.docx'));

const patterns = [
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { name: 'Supabase service role key', regex: /sb_secret_[A-Za-z0-9_-]{10,}/g },
  { name: 'OpenAI project key', regex: /sk-proj-[A-Za-z0-9_-]{10,}/g },
  { name: 'OpenAI secret key', regex: /sk-[A-Za-z0-9]{20,}/g },
  { name: 'Resend API key', regex: /\bre_[A-Za-z0-9_-]{10,}\b/g },
];

const findings = [];
for (const file of files) {
  let content = '';
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      findings.push({ file, name: pattern.name, sample: matches[0] });
    }
  }
}

if (findings.length > 0) {
  console.error('Potential credential leaks detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.name} (${finding.sample.slice(0, 8)}...)`);
  }
  process.exit(1);
}

console.log('No credential-pattern leaks detected in tracked text files.');
