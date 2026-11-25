// Array Engine - Address calculation, Insertion/Deletion, Linear & Binary Search

const ARRAY_MODULES_METADATA = {
  address: {
    name: 'Array Address Calculation',
    how: 'A 1D array stores elements one after another in memory. Multiply the index by the element size and add it to the base address to find any element instantly.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    formula: 'Address(A[i]) = Base Address + (i × Size of Element)'
  },
  insertDelete: {
    name: 'Array Insertion and Deletion',
    how: 'Inserting shifts every element at or after the position one place right. Deleting shifts the elements after it one place left. Each shift is one operation.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  linearSearch: {
    name: 'Linear Search',
    how: 'Check each element from left to right until one equals the target or the array ends. It works on any array, sorted or not.',
    timeComplexity: 'Best O(1), worst O(n)',
    spaceComplexity: 'O(1)'
  },
  binarySearch: {
    name: 'Binary Search',
    how: 'Binary Search needs a sorted array. Compare the target with the middle element and throw away the half that cannot contain it. Repeat on what is left.',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)'
  }
};

function parseNumbers(input) {
  if (Array.isArray(input)) {
    return input.every(Number.isInteger) && input.length >= 1 && input.length <= 12 ? input : null;
  }
  const parts = String(input || '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  return parts.length >= 1 && parts.length <= 12 && parts.every(Number.isInteger) ? parts : null;
}

function calculateAddress(params) {
  const B = Number(params.base ?? 1000);
  const Z = Number(params.size ?? 4);
  const i = Number(params.i ?? 3);
  const n = Number(params.n ?? 8);

  if (![B, Z, i, n].every(Number.isInteger) || B < 0 || Z < 1 || n < 1 || n > 12 || i < 0 || i >= n) {
    throw new Error('Use whole numbers: size at least 1, length 1 to 12, and index from 0 to length−1.');
  }

  const makeCells = (highlight) =>
    Array.from({ length: n }, (_, k) => ({
      t: `A[${k}]`,
      s: String(B + k * Z),
      c: highlight && k === i ? highlight : ''
    }));

  const targetAddress = B + i * Z;
  const targetHex = '0x' + targetAddress.toString(16).toUpperCase();

  const steps = [
    {
      cells: makeCells(),
      msg: `Memory is a row of boxes. Each element uses ${Z} bytes, starting at ${B}.`
    },
    {
      cells: makeCells('hi'),
      msg: `We want A[${i}]. Formula: Address(A[i]) = Base Address + (i × Size of Element).`
    },
    {
      cells: makeCells('hi'),
      msg: `Substitute: ${B} + (${i} × ${Z}).`
    },
    {
      cells: makeCells('hi'),
      msg: `Multiply: ${i} × ${Z} = ${i * Z} bytes from the start.`
    },
    {
      cells: makeCells('ok'),
      msg: `Add: ${B} + ${i * Z} = ${targetAddress} (hex ${targetHex}). A[${i}] lives there.`
    }
  ];

  return {
    module: 'address',
    metadata: ARRAY_MODULES_METADATA.address,
    inputs: { base: B, size: Z, index: i, length: n },
    result: { address: targetAddress, hex: targetHex },
    steps
  };
}

function insertOrDelete(params) {
  const mode = params.mode === 'Delete' ? 'Delete' : 'Insert';
  const a = parseNumbers(params.arr ?? [10, 20, 30, 40, 50]);
  const val = Number(params.val ?? 25);
  const pos = Number(params.pos ?? 2);

  if (!a || !Number.isInteger(val) || !Number.isInteger(pos)) {
    throw new Error('Enter 1 to 12 whole numbers separated by commas, and whole-number values.');
  }

  const n = a.length;
  const steps = [];
  let ops = 0;

  const bx = (b, cls, msg) => ({
    cells: b.map((x, k) => ({
      t: x === null ? '' : x,
      s: '[' + k + ']',
      c: (x === null ? 'empty ' : '') + (cls[k] || '')
    })),
    msg
  });

  if (mode === 'Insert') {
    if (pos < 0 || pos > n || n > 11) {
      throw new Error(`Position must be 0 to ${n}, and array can hold at most 11 values before inserting.`);
    }
    const b = a.concat([null]);
    steps.push(bx(b, {}, `Array of ${n} with one free slot. Insert ${val} at index ${pos}.`));
    for (let k = n - 1; k >= pos; k--) {
      b[k + 1] = b[k];
      b[k] = null;
      ops++;
      steps.push(bx(b, { [k + 1]: 'hi' }, `Shift ${b[k + 1]} from index ${k} to ${k + 1}. Operations: ${ops}.`));
    }
    b[pos] = val;
    ops++;
    steps.push(bx(b, { [pos]: 'ok' }, `Place ${val} at index ${pos}. Done with ${ops} operations (${ops - 1} shifts and 1 write).`));

    return {
      module: 'insert',
      metadata: ARRAY_MODULES_METADATA.insertDelete,
      finalArray: b,
      totalOperations: ops,
      steps
    };
  } else {
    if (pos < 0 || pos >= n) {
      throw new Error(`Position must be 0 to ${n - 1}.`);
    }
    const b = a.slice();
    steps.push(bx(b, { [pos]: 'mid' }, `Delete ${b[pos]} at index ${pos}.`));
    const deletedVal = b[pos];
    b[pos] = null;
    ops++;
    steps.push(bx(b, { [pos]: 'mid' }, `Remove ${deletedVal}. This leaves a gap. Operations: ${ops}.`));
    for (let k = pos; k < n - 1; k++) {
      b[k] = b[k + 1];
      b[k + 1] = null;
      ops++;
      steps.push(bx(b, { [k]: 'hi' }, `Shift ${b[k]} left from index ${k + 1} to ${k}. Operations: ${ops}.`));
    }
    const finalArr = b.slice(0, n - 1);
    steps.push(bx(finalArr, {}, `Done. ${deletedVal} deleted with ${ops} operations (1 removal and ${ops - 1} shifts). New length: ${n - 1}.`));

    return {
      module: 'delete',
      metadata: ARRAY_MODULES_METADATA.insertDelete,
      deletedValue: deletedVal,
      finalArray: finalArr,
      totalOperations: ops,
      steps
    };
  }
}

function linearSearch(params) {
  const a = parseNumbers(params.arr ?? [7, 3, 9, 1, 5, 8]);
  const t = Number(params.t ?? 5);

  if (!a || !Number.isInteger(t)) {
    throw new Error('Enter 1 to 12 whole numbers separated by commas, and a whole-number target.');
  }

  const steps = [];
  const mk = (cur, res) =>
    a.map((x, k) => ({
      t: x,
      s: '[' + k + ']',
      c: k === cur ? res : k < cur ? 'no' : ''
    }));

  let comps = 0;
  let foundIndex = -1;

  steps.push({
    cells: mk(-1),
    msg: `Look for ${t}, starting at index 0.`
  });

  for (let k = 0; k < a.length; k++) {
    comps++;
    if (a[k] === t) {
      foundIndex = k;
      steps.push({
        cells: mk(k, 'cmp'),
        msg: `Is ${a[k]} = ${t}? Comparisons: ${comps}.`
      });
      steps.push({
        cells: mk(k, 'ok'),
        msg: `Match! Found ${t} at index ${k} (position ${k + 1}) after ${comps} comparisons.`
      });
      break;
    }
    steps.push({
      cells: mk(k, 'cmp'),
      msg: `Is ${a[k]} = ${t}? No. Comparisons: ${comps}.`
    });
  }

  if (foundIndex === -1) {
    steps.push({
      cells: a.map(x => ({ t: x, s: '', c: 'no' })),
      msg: `Element Not Found. ${t} is not in the array (${comps} comparisons).`
    });
  }

  return {
    module: 'linearSearch',
    metadata: ARRAY_MODULES_METADATA.linearSearch,
    target: t,
    found: foundIndex !== -1,
    index: foundIndex,
    comparisons: comps,
    steps
  };
}

function binarySearch(params) {
  let a = parseNumbers(params.arr ?? [9, 3, 7, 1, 5, 8]);
  const t = Number(params.t ?? 7);
  const sortFirst = params.mode === 'Sort it for me' || params.sortFirst === true;

  if (!a || !Number.isInteger(t)) {
    throw new Error('Enter 1 to 12 whole numbers separated by commas, and a whole-number target.');
  }

  if (sortFirst) {
    a = a.slice().sort((x, y) => x - y);
  } else if (a.some((x, i) => i > 0 && x < a[i - 1])) {
    throw new Error('This array is not sorted, and Binary Search needs a sorted one. Choose "Sort it for me" or enter ascending numbers.');
  }

  let lo = 0;
  let hi = a.length - 1;
  let comps = 0;
  let foundIndex = -1;
  const steps = [];

  const S = (l, h, m, cls, msg) => {
    steps.push({
      cells: a.map((x, k) => ({
        t: x,
        s: '[' + k + ']' + (k === l ? ' L' : '') + (k === m ? ' M' : '') + (k === h ? ' H' : ''),
        c: (k < l || k > h ? 'no ' : '') + (cls[k] || '')
      })),
      msg
    });
  };

  S(lo, hi, -1, {}, (sortFirst ? `Sorted for you: ${a.join(', ')}. ` : '') + `Searching for ${t}. Low is 0 and High is ${hi}.`);

  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    comps++;
    if (a[m] === t) {
      foundIndex = m;
      S(lo, hi, m, { [m]: 'ok' }, `Mid = ${m}, value ${a[m]} equals ${t}. Found at index ${m} (position ${m + 1}) after ${comps} comparisons.`);
      break;
    }
    if (a[m] < t) {
      S(lo, hi, m, { [m]: 'cmp' }, `Mid = ${m}, value ${a[m]} < ${t}. Target is on the right, so Low becomes ${m + 1}. Comparisons: ${comps}.`);
      lo = m + 1;
    } else {
      S(lo, hi, m, { [m]: 'cmp' }, `Mid = ${m}, value ${a[m]} > ${t}. Target is on the left, so High becomes ${m - 1}. Comparisons: ${comps}.`);
      hi = m - 1;
    }
  }

  if (foundIndex === -1) {
    steps.push({
      cells: a.map(x => ({ t: x, s: '', c: 'no' })),
      msg: `Low passed High, so the search space is empty. Element Not Found (${comps} comparisons).`
    });
  }

  return {
    module: 'binarySearch',
    metadata: ARRAY_MODULES_METADATA.binarySearch,
    target: t,
    found: foundIndex !== -1,
    index: foundIndex,
    comparisons: comps,
    steps
  };
}

module.exports = {
  ARRAY_MODULES_METADATA,
  calculateAddress,
  insertOrDelete,
  linearSearch,
  binarySearch
};
