import test from 'node:test';
import assert from 'node:assert/strict';
import { adminCredentials, checkAdminLogin, buildGrowthSeries, activeInWindow, dayRange } from './admin.js';

test('admin credentials default to admin1/admin1 only outside production', () => {
  assert.deepEqual(adminCredentials({ NODE_ENV: 'development' } as any), { username: 'admin1', password: 'admin1' });
  assert.equal(adminCredentials({ NODE_ENV: 'production' } as any), null);
  assert.deepEqual(adminCredentials({ NODE_ENV: 'production', ADMIN_EMAIL: ' Boss@X.com ', ADMIN_PASSWORD: 'pw' } as any), { username: 'boss@x.com', password: 'pw' });
});

test('admin login checks both fields, username case-insensitive', () => {
  const creds = { username: 'admin1', password: 'admin1' };
  assert.equal(checkAdminLogin(' ADMIN1 ', 'admin1', creds), true);
  assert.equal(checkAdminLogin('admin1', 'Admin1', creds), false);
  assert.equal(checkAdminLogin('admin2', 'admin1', creds), false);
  assert.equal(checkAdminLogin('admin1', 'admin1', null), false);
});

test('growth series carries a running total and distinct daily actives', () => {
  const days = ['2026-11-01', '2026-11-02', '2026-11-03'];
  const activity = [{ date: '2026-11-01', userId: 'a' }, { date: '2026-11-01', userId: 'a' }, { date: '2026-11-03', userId: 'a' }, { date: '2026-11-03', userId: 'b' }];
  const series = buildGrowthSeries(days, { '2026-11-01': 2, '2026-11-03': 1 }, 10, activity);
  assert.deepEqual(series.map(r => r.totalUsers), [12, 12, 13]);
  assert.deepEqual(series.map(r => r.activeUsers), [1, 0, 2]);
  assert.equal(activeInWindow(days, activity, 1), 2);
  assert.equal(activeInWindow(days, [{ date: '2026-11-01', userId: 'c' }], 2), 0);
  assert.equal(activeInWindow(days, activity, 3), 2);
});

test('day range ends today in IST and has the requested length', () => {
  const keys = dayRange(14, new Date('2026-11-14T20:00:00Z'));
  assert.equal(keys.length, 14);
  assert.equal(keys.at(-1), '2026-11-15');
  assert.equal(keys[0], '2026-11-02');
});
