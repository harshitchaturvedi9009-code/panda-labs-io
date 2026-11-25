const test = require('node:test');
const assert = require('node:assert');
const { simulateSort, generateRandomArray, algorithms } = require('../src/services/sortingEngine');

test('Sorting Engine - all 7 algorithms produce sorted arrays', () => {
  const sample = [45, 12, 89, 3, 27, 64, 18];
  const expected = [3, 12, 18, 27, 45, 64, 89];

  for (const algo of Object.keys(algorithms)) {
    const result = simulateSort(algo, sample);
    assert.deepStrictEqual(result.sortedArray, expected, `${algo} failed to sort correctly`);
    assert.ok(result.steps.length > 0, `${algo} should generate steps`);
    assert.ok(typeof result.totalComparisons === 'number');
    assert.ok(typeof result.totalMoves === 'number');
  }
});

test('Sorting Engine - validation prevents invalid input', () => {
  assert.throws(() => simulateSort('unknown_algo', [1, 2, 3]));
  assert.throws(() => simulateSort('bubble', [1])); // too short
  assert.throws(() => simulateSort('bubble', Array(30).fill(5))); // too long
  assert.throws(() => simulateSort('bubble', ['not', 'numbers']));
});

test('Sorting Engine - random array generation', () => {
  const arr = generateRandomArray(15);
  assert.strictEqual(arr.length, 15);
  arr.forEach(val => {
    assert.ok(Number.isInteger(val));
    assert.ok(val >= 5 && val <= 99);
  });
});
