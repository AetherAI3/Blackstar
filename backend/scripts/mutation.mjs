// Bounded, declared mutation sample. Works in temporary copies, never source files.
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const source = fileURLToPath(new URL('../', import.meta.url));
const repo = fileURLToPath(new URL('../../', import.meta.url));
const mutations = [
  { id: 'M01', file: 'access.mjs', from: "m.status === 'active'", to: 'true', attack: 'accept revoked membership' },
  { id: 'M02', file: 'billing.mjs', from: "requireThat(digest(quote.snapshot) === quote.fingerprint, 'QUOTE_TAMPERED');", to: "requireThat(true, 'QUOTE_TAMPERED');", attack: 'skip quote integrity check', all: true },
  { id: 'M03', file: 'money.mjs', from: '+ 5000n', to: '+ 0n', attack: 'truncate rather than round a half cent' },
  { id: 'M04', file: 'webhooks.mjs', from: 'Buffer.isBuffer(rawBody)', to: 'true', attack: 'accept parsed body at signature boundary' },
  { id: 'M05', file: 'ledger.mjs', from: '<= payment.amountCents', to: '<= Number.MAX_SAFE_INTEGER', attack: 'allow refund above collected payment' },
  { id: 'M06', file: 'ledger.mjs', from: 'new Set(candidates.map(x => x.key)).size === candidates.length', to: 'true', attack: 'double-count repeated provider fact' },
  { id: 'M07', file: 'billing.mjs', from: "quote.snapshot.billingMode === 'one_time'", to: 'true', attack: 'reuse one-time planner for recurring period' },
  { id: 'M08', file: 'billing.mjs', from: 'quote.snapshot.expiresAt > now', to: 'true', attack: 'accept expired quote' },
  { id: 'M09', file: 'billing.mjs', from: 'digest(obligation)', to: 'digest({ quoteId: quote.id, quoteVersion: quote.version, stageKey: stage.key })', attack: 'drop tenant/project from provider idempotency key' },
  { id: 'M10', file: 'billing.mjs', from: 'approved.quoteVersion === quote.version', to: 'true', attack: 'reuse prior-version milestone approval' }
];

const baseline = spawnSync(process.execPath, ['--test'], { cwd: source, encoding: 'utf8', timeout: 20000 });
if (baseline.status !== 0) throw new Error('Baseline failed; mutation run stopped.');
const results = [];
for (const mutant of mutations) {
  const directory = await mkdtemp(join(tmpdir(), 'blackstar-mutation-'));
  try {
    await cp(join(source, 'src'), join(directory, 'backend', 'src'), { recursive: true });
    await cp(join(source, 'test'), join(directory, 'backend', 'test'), { recursive: true });
    await cp(join(repo, 'billing'), join(directory, 'billing'), { recursive: true });
    const path = join(directory, 'backend', 'src', mutant.file);
    const text = await readFile(path, 'utf8');
    if (!text.includes(mutant.from)) throw new Error(`Mutation anchor missing: ${mutant.id}`);
    await writeFile(path, mutant.all ? text.replaceAll(mutant.from, mutant.to) : text.replace(mutant.from, mutant.to));
    const syntax = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8', timeout: 20000 });
    if (syntax.status !== 0) throw new Error(`Invalid mutant syntax: ${mutant.id}`);
    const run = spawnSync(process.execPath, ['--test'], { cwd: join(directory, 'backend'), encoding: 'utf8', timeout: 20000 });
    if (run.error || run.signal) throw new Error(`Mutation runner failed: ${mutant.id}`);
    results.push({ id: mutant.id, attack: mutant.attack, killed: run.status !== 0 });
  } finally { await rm(directory, { recursive: true, force: true }); }
}
const killed = results.filter(result => result.killed).length;
console.log(JSON.stringify({ scope: 'ten selected security/money boundary mutations; not exhaustive', killed,
  survived: results.length - killed, total: results.length, score: killed / results.length, results }, null, 2));
if (killed !== results.length) process.exitCode = 1;
