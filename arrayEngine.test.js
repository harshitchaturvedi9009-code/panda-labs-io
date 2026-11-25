const test = require('node:test');
const assert = require('node:assert');
const {
  calculateAddress,
  insertOrDelete,
  linearSearch,
  binarySearch
} = require('../src/services/arrayEngine');

test('Array Engine - Address Calculation', () => {
  const res = calculateAddress({ base: 2000, size: 4, i: 5, n: 10 });
  assert.strictEqual(res.result.address, 2020);
  assert.strictEqual(res.result.hex, '0x7E4');
  assert.strictEqual(res.steps.length, 5);
});

test('Array Engine - Insertion and Deletion', () => {
  // Insert
  const ins = insertOrDelete({ mode: 'Insert', arr: [10, 20, 40], val: 30, pos: 2 });
  assert.deepStrictEqual(ins.finalArray, [10, 20, 30, 40]);

  // Delete
  const del = insertOrDelete({ mode: 'Delete', arr: [10, 20, 30, 40], pos: 1 });
  assert.deepStrictEqual(del.finalArray, [10, 30, 40]);
  assert.strictEqual(del.deletedValue, 20);
});

test('Array Engine - Linear Search', () => {
  const found = linearSearch({ arr: [10, 50, 30, 40], t: 30 });
  assert.strictEqual(found.found, true);
  assert.strictEqual(found.index, 2);

  const notFound = linearSearch({ arr: [10, 50, 30, 40], t: 99 });
  assert.strictEqual(notFound.found, false);
  assert.strictEqual(notFound.index, -1);
});

test('Array Engine - Binary Search', () => {
  const found = binarySearch({ arr: [10, 20, 30, 40, 50, 60], t: 40 });
  assert.strictEqual(found.found, true);
  assert.strictEqual(found.index, 3);

  const notFound = binarySearch({ arr: [10, 20, 30, 40, 50, 60], t: 25 });
  assert.strictEqual(notFound.found, false);
  assert.strictEqual(notFound.index, -1);
});
