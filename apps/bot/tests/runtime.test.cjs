const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { parseSchedule } = require('@vezbot/shared');
const { ChannelType } = require('discord.js');

function loadService(name, prisma, extras = {}) {
  const exports = {};
  runInNewContext(readFileSync(join(__dirname, '../dist/services', `${name}.js`), 'utf8'), {
    exports, Date, Buffer, console,
    require: id => id === '@vezbot/database' ? { prisma }
      : id === '@vezbot/discord' ? { createLogger: () => ({ info() {}, warn() {}, error() {} }) }
      : id === './poll.service' ? { closeDuePolls: async () => {} } : require(id),
    ...extras,
  });
  return exports;
}

test('local schedules convert to UTC independently of the server timezone', () => {
  assert.equal(parseSchedule('2030-01-15T12:00', 'America/Los_Angeles', 0).toISOString(), '2030-01-15T20:00:00.000Z');
  assert.equal(parseSchedule('2030-07-15T12:00', 'America/Los_Angeles', 0).toISOString(), '2030-07-15T19:00:00.000Z');
});

test('DST gaps and ambiguous times require an explicit offset', () => {
  assert.throws(() => parseSchedule('2030-03-10T02:30', 'America/Los_Angeles', 0), /skipped or ambiguous/);
  assert.throws(() => parseSchedule('2030-11-03T01:30', 'America/Los_Angeles', 0), /skipped or ambiguous/);
  assert.equal(parseSchedule('2030-11-03T01:30-08:00', 'America/Los_Angeles', 0).toISOString(), '2030-11-03T09:30:00.000Z');
});

test('invalid zones, invalid dates, and past schedules are rejected', () => {
  assert.throws(() => parseSchedule('2030-01-15T12:00', 'Not/AZone', 0));
  assert.throws(() => parseSchedule('2030-02-30T12:00', 'UTC', 0));
  assert.throws(() => parseSchedule('2000-01-15T12:00', 'UTC'));
});

function pollFixture(overrides = {}) {
  const changes = [];
  const channel = { type: ChannelType.GuildText, permissionsFor: () => ({ has: () => true }), send: async () => ({ id: 'message' }) };
  const poll = { id: 'poll', guildId: 'guild', channelId: 'channel', question: 'Test question?', optionsJson: '["Yes","No"]', anonymous: false, status: 'DRAFT', ...overrides };
  const prisma = { poll: { findFirst: async () => poll, updateMany: async args => { changes.push(args); return { count: 1 }; }, update: async args => { changes.push(args); return poll; } } };
  const guild = { id: 'guild', members: { me: {} }, channels: { fetch: async () => channel } };
  return { service: loadService('poll.service', prisma), guild, channel, changes };
}

test('poll publication records the Discord message and active state', async () => {
  const fixture = pollFixture();
  await fixture.service.setLivePollStatus(fixture.guild, 'poll', 'ACTIVE');
  assert.equal(fixture.changes[0].data.status, 'PUBLISHING');
  assert.equal(fixture.changes[1].data.status, 'ACTIVE');
  assert.equal(fixture.changes[1].data.messageId, 'message');
});

test('Discord send failure restores the draft instead of claiming publication', async () => {
  const fixture = pollFixture();
  fixture.channel.send = async () => { throw new Error('Permission denied'); };
  await assert.rejects(fixture.service.setLivePollStatus(fixture.guild, 'poll', 'ACTIVE'));
  assert.equal(fixture.changes.at(-1).data.status, 'DRAFT');
});

test('unsupported anonymous polls fail before sending or changing state', async () => {
  const fixture = pollFixture({ anonymous: true });
  await assert.rejects(fixture.service.setLivePollStatus(fixture.guild, 'poll', 'ACTIVE'), /anonymous/);
  assert.equal(fixture.changes.length, 0);
});

test('a reminder whose claim was lost to another worker is never sent', async () => {
  let sent = false;
  const prisma = { reminder: { findMany: async () => [{ id: 'reminder', userId: 'user' }], updateMany: async () => ({ count: 0 }) } };
  const scheduler = loadService('scheduler.service', prisma, { setInterval: () => ({ unref() {} }), clearInterval() {} });
  const stop = scheduler.startScheduler({ isReady: () => true, users: { fetch: async () => ({ send: async () => { sent = true; } }) } });
  await new Promise(setImmediate);
  stop();
  assert.equal(sent, false);
});

test('reminder delivery failure is recorded without marking the reminder sent', async () => {
  const changes = [];
  const prisma = { reminder: {
    findMany: async () => [{ id: 'reminder', userId: 'user', message: 'Remember' }],
    updateMany: async () => ({ count: 1 }),
    update: async args => { changes.push(args); },
  } };
  const scheduler = loadService('scheduler.service', prisma, { setInterval: () => ({ unref() {} }), clearInterval() {} });
  const stop = scheduler.startScheduler({ isReady: () => true, users: { fetch: async () => ({ send: async () => { throw new Error('DM closed'); } }) } });
  await new Promise(setImmediate);
  stop();
  assert.equal(changes.length, 1);
  assert.equal(changes[0].data.sent, undefined);
  assert.match(changes[0].data.lastError, /Delivery failed/);
});
