const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

function loadDiscord(fetchMock) {
  const source = readFileSync(join(__dirname, '../src/lib/discord.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  let now = 1000;
  class TestDate extends Date { static now() { return now; } }
  runInNewContext(outputText, {
    exports, require, fetch: fetchMock, Date: TestDate, process,
    crypto: require('node:crypto').webcrypto, TextEncoder,
    console: { error() {} },
  });
  return { ...exports, advance: () => { now += 30_001; } };
}

const guilds = [
  { id: '1', name: 'Managed', permissions: '32' },
  { id: '2', name: 'Ordinary member', permissions: '0' },
];

test('concurrent guild lookups share one request and filter permissions', async () => {
  let calls = 0;
  const discord = loadDiscord(async () => {
    calls++;
    return Response.json(guilds);
  });
  const [list, guild] = await Promise.all([
    discord.getManageableGuilds('first-user'),
    discord.getManageableGuild('first-user', '1'),
  ]);
  assert.equal(calls, 1);
  assert.equal(list.length, 1);
  assert.equal(guild.id, '1');
});

test('cache is isolated per credential and expires after 30 seconds', async () => {
  let calls = 0;
  const discord = loadDiscord(async () => { calls++; return Response.json(guilds); });
  await discord.getManageableGuilds('first-user');
  await discord.getManageableGuilds('second-user');
  assert.equal(calls, 2);
  discord.advance();
  await discord.getManageableGuilds('first-user');
  assert.equal(calls, 3);
});

test('rate limiting raises an error instead of reporting no eligible servers', async () => {
  let calls = 0;
  const discord = loadDiscord(async () => {
    calls++;
    return calls === 1 ? new Response(null, { status: 429 }) : Response.json(guilds);
  });
  await assert.rejects(discord.getManageableGuilds('first-user'), error => error.status === 429);
  assert.equal((await discord.getManageableGuilds('first-user')).length, 1);
  assert.equal(calls, 2);
});

test('failed network requests are not retained in the cache', async () => {
  let calls = 0;
  const discord = loadDiscord(async () => {
    if (++calls === 1) throw new Error('Connection unavailable');
    return Response.json(guilds);
  });
  await assert.rejects(discord.getManageableGuilds('first-user'));
  await discord.getManageableGuilds('first-user');
  assert.equal(calls, 2);
});
