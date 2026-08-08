import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLatestSponsorsBySlug } from './selectLatestSponsorsBySlug.js';

const membership = (since) => ({
  account: { slug: 'sponsor' },
  since,
});

test('replaces a membership with an invalid timestamp when a valid timestamp follows', () => {
  const latest = membership('2026-01-01T00:00:00.000Z');
  const sponsors = selectLatestSponsorsBySlug([membership(null), latest]);

  assert.equal(sponsors.get('sponsor'), latest);
});

test('retains a valid membership when an invalid timestamp follows', () => {
  const latest = membership('2026-01-01T00:00:00.000Z');
  const sponsors = selectLatestSponsorsBySlug([latest, membership('invalid')]);

  assert.equal(sponsors.get('sponsor'), latest);
});

test('retains the first membership when neither timestamp is valid', () => {
  const first = membership(null);
  const sponsors = selectLatestSponsorsBySlug([first, membership(undefined)]);

  assert.equal(sponsors.get('sponsor'), first);
});

test('selects the newer membership when both timestamps are valid', () => {
  const latest = membership('2026-01-02T00:00:00.000Z');
  const sponsors = selectLatestSponsorsBySlug([
    membership('2026-01-01T00:00:00.000Z'),
    latest,
  ]);

  assert.equal(sponsors.get('sponsor'), latest);
});
