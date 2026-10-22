import { equal, match } from 'node:assert/strict';
import { test } from 'node:test';
import { localDate, localDateOf, localTimestamp } from '../src/time.ts';

test('stored timestamps keep the local offset and name the same instant', () => {
  const when = new Date('2026-10-22T03:18:00.713Z');
  const stamp = localTimestamp(when);
  match(stamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
  equal(new Date(stamp).getTime(), when.getTime());
});

test('the human date is the local calendar day, also for an older Z timestamp', () => {
  const when = new Date('2026-10-22T03:18:00.713Z');
  const day = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}`;
  equal(localDate(when), day);
  equal(localDateOf('2026-10-22T03:18:00.713Z'), day);
  equal(localDateOf(localTimestamp(when)), day);
  equal(localDateOf(undefined), undefined);
  equal(localDateOf('not a date'), undefined);
});
