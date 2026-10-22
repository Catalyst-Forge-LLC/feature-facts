import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import { rollupSentence } from '../src/render.ts';

const zero = { eligible: 0, assessed: 0, with_links: 0, without_links: 0, partial: 0, unassessed: 0, not_applicable: 0, undisclosed: 0 };

test('label rollups read as sentences: no 0 of 0, no 1 are, no empty buckets', () => {
  equal(rollupSentence('Docs', zero), 'Docs: no eligible capabilities.');
  equal(
    rollupSentence('Docs', { ...zero, eligible: 3, partial: 1, unassessed: 2 }),
    'Docs: no capability is fully assessed. Of 3 eligible capabilities, 1 is partially assessed and 2 are unassessed.',
  );
  equal(rollupSentence('Tests', { ...zero, eligible: 1, assessed: 1, with_links: 1 }), 'Tests: 1 of 1 assessed capability has linked evidence.');
  equal(
    rollupSentence('Tests', { ...zero, eligible: 4, assessed: 2, with_links: 2, unassessed: 2 }),
    'Tests: 2 of 2 assessed capabilities have linked evidence. Of 4 eligible capabilities, 2 are unassessed.',
  );
  equal(
    rollupSentence('Docs', { ...zero, eligible: 4, assessed: 1, without_links: 1, partial: 1, not_applicable: 1, undisclosed: 1 }),
    'Docs: the 1 assessed capability has no linked evidence. Of 4 eligible capabilities, 1 is partially assessed, 1 is not applicable, and 1 is undisclosed.',
  );
  equal(
    rollupSentence('Docs', { ...zero, eligible: 2, assessed: 2, without_links: 2 }),
    'Docs: none of the 2 assessed capabilities has linked evidence.',
  );
});
