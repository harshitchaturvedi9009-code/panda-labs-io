// Sorting Engine - Generates step-by-step traces and metrics for sorting algorithms

const ALGOS_METADATA = {
  selection: {
    name: 'Selection',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    extraSpace: 'O(1)',
    stable: 'No',
    tag: 'Pick the smallest, put it first.',
    idea: 'Repeatedly scan the unsorted part for the smallest value and swap it to the front of that part.',
    when: 'Tiny lists, or when writes are expensive: it does at most n−1 swaps.',
    code: [
      'for i = 0 to n-2',
      '  min = i',
      '  for j = i+1 to n-1',
      '    if a[j] < a[min]',
      '      min = j',
      '  swap(a[i], a[min])'
    ]
  },
  bubble: {
    name: 'Bubble',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    extraSpace: 'O(1)',
    stable: 'Yes',
    tag: 'Big stalks float to the right.',
    idea: 'Compare neighbours and swap them when out of order. Each pass settles the largest remaining value at the end.',
    when: 'Teaching, and nearly sorted data with the early-exit check.',
    code: [
      'repeat n-1 times',
      '  for j = 0 to n-i-2',
      '    if a[j] > a[j+1]',
      '      swap(a[j], a[j+1])',
      '  stop if no swaps'
    ]
  },
  insertion: {
    name: 'Insertion',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    extraSpace: 'O(1)',
    stable: 'Yes',
    tag: 'Sort like a hand of cards.',
    idea: 'Take the next value as a key and slide larger sorted values right until the key fits.',
    when: 'Small or nearly sorted lists. Many libraries use it for small chunks.',
    code: [
      'for i = 1 to n-1',
      '  key = a[i]',
      '  while j >= 0 and a[j] > key',
      '    a[j+1] = a[j]',
      '  a[j+1] = key'
    ]
  },
  quick: {
    name: 'Quick',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    extraSpace: 'O(log n)',
    stable: 'No',
    tag: 'Partition around a pivot.',
    idea: 'Choose a pivot, move smaller values left and larger right, fix the pivot in place, then recurse on both sides.',
    when: 'General purpose in memory. Worst case happens on bad pivots, such as sorted input with a last-element pivot.',
    code: [
      'quick(lo, hi)',
      '  pivot = a[hi]',
      '  for j = lo to hi-1',
      '    if a[j] < pivot',
      '      swap into left side',
      '  put pivot in place',
      '  quick both sides'
    ]
  },
  merge: {
    name: 'Merge',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    extraSpace: 'O(n)',
    stable: 'Yes',
    tag: 'Divide, sort, merge.',
    idea: 'Split the array in half until single items remain, then merge sorted halves by repeatedly taking the smaller front value.',
    when: 'When you need guaranteed O(n log n) and stability, or are sorting linked lists and external data.',
    code: [
      'mergeSort(l, r)',
      '  mid = (l+r)/2',
      '  sort both halves',
      '  compare fronts of halves',
      '  write the smaller',
      '  copy leftovers'
    ]
  },
  heap: {
    name: 'Heap',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    extraSpace: 'O(1)',
    stable: 'No',
    tag: 'Use a max-heap as a sorting machine.',
    idea: 'Build a max-heap, then repeatedly swap the root with the last heap item and sift the new root down.',
    when: 'Guaranteed O(n log n) with no extra memory.',
    code: [
      'build max-heap',
      'for e = n-1 down to 1',
      '  swap(a[0], a[e])',
      '  shrink heap by one',
      '  compare children',
      '  sift down'
    ]
  },
  radix: {
    name: 'Radix',
    best: 'O(d(n+k))',
    average: 'O(d(n+k))',
    worst: 'O(d(n+k))',
    extraSpace: 'O(n+k)',
    stable: 'Yes',
    tag: 'Sort digit by digit.',
    idea: 'Use a stable bucket pass for each digit, from least to most significant. Values never get compared to each other.',
    when: 'Fixed-width integers or strings, when d is small. Needs non-negative integers here.',
    code: [
      'for each digit place',
      '  bucket by that digit',
      '  collect in bucket order',
      '  repeat for next digit'
    ]
  }
};

function createRecorder(arr) {
  const R = {
    a: arr.slice(),
    steps: [],
    sorted: new Set(),
    comps: 0,
    moves: 0
  };

  R.rec = (msg, line, o = {}) => {
    R.steps.push({
      a: R.a.slice(),
      msg,
      line,
      comps: R.comps,
      moves: R.moves,
      sorted: [...R.sorted],
      cmp: o.cmp || [],
      swp: o.swp || [],
      pivot: o.pivot ?? -1
    });
  };

  R.finish = (line, customMsg) => {
    R.a.forEach((_, i) => R.sorted.add(i));
    R.rec('Sorted! ' + (customMsg || 'Every stalk is in its final place.'), line);
    return R.steps;
  };

  return R;
}

const algorithms = {
  selection(arr) {
    const R = createRecorder(arr);
    const a = R.a;
    const n = a.length;
    R.rec('Start. Find the smallest stalk, then the next smallest, and so on.', 0);
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      R.rec(`Round ${i + 1}: assume ${a[i]} is the smallest.`, 1, { pivot: m });
      for (let j = i + 1; j < n; j++) {
        R.comps++;
        R.rec(`Is ${a[j]} smaller than the minimum ${a[m]}?`, 3, { cmp: [j], pivot: m });
        if (a[j] < a[m]) {
          m = j;
          R.rec(`Yes. ${a[j]} is the new minimum.`, 4, { pivot: m });
        }
      }
      if (m !== i) {
        [a[i], a[m]] = [a[m], a[i]];
        R.moves++;
        R.sorted.add(i);
        R.rec(`Swap ${a[i]} into position ${i}.`, 5, { swp: [i, m] });
      } else {
        R.sorted.add(i);
        R.rec(`${a[i]} is already in place.`, 5);
      }
    }
    return R.finish(5);
  },

  bubble(arr) {
    const R = createRecorder(arr);
    const a = R.a;
    const n = a.length;
    R.rec('Start. Neighbours are compared and swapped when out of order.', 0);
    for (let i = 0; i < n - 1; i++) {
      let sw = false;
      for (let j = 0; j < n - i - 1; j++) {
        R.comps++;
        R.rec(`Compare ${a[j]} and ${a[j + 1]}.`, 2, { cmp: [j, j + 1] });
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          R.moves++;
          sw = true;
          R.rec('Out of order, so they swap.', 3, { swp: [j, j + 1] });
        }
      }
      R.sorted.add(n - 1 - i);
      if (!sw) return R.finish(4, 'A pass with no swaps means we can stop early.');
      R.rec(`${a[n - 1 - i]} has bubbled to its final place.`, 1);
    }
    return R.finish(4);
  },

  insertion(arr) {
    const R = createRecorder(arr);
    const a = R.a;
    const n = a.length;
    R.sorted.add(0);
    R.rec('One stalk alone is sorted. Grow the sorted part to the right.', 0);
    for (let i = 1; i < n; i++) {
      const k = a[i];
      R.rec(`Pick up ${k} as the key.`, 1, { cmp: [i] });
      let j = i - 1;
      while (j >= 0) {
        R.comps++;
        if (a[j] > k) {
          R.rec(`${a[j]} is bigger than ${k}, so it shifts right.`, 2, { cmp: [j] });
          a[j + 1] = a[j];
          R.moves++;
          R.rec(`${a[j]} moves to position ${j + 1}.`, 3, { swp: [j + 1] });
          j--;
        } else {
          R.rec(`${a[j]} is not bigger than ${k}. Right spot found.`, 2, { cmp: [j] });
          break;
        }
      }
      a[j + 1] = k;
      R.moves++;
      R.sorted.add(i);
      R.rec(`Drop ${k} into position ${j + 1}.`, 4, { swp: [j + 1] });
    }
    return R.finish(4);
  },

  quick(arr) {
    const R = createRecorder(arr);
    const a = R.a;
    R.rec('Start. Pick a pivot, put smaller stalks on its left, then sort each side.', 0);
    const q = (lo, hi) => {
      if (lo > hi) return;
      if (lo === hi) {
        R.sorted.add(lo);
        R.rec(`${a[lo]} is alone, so it is in place.`, 0);
        return;
      }
      const p = a[hi];
      let i = lo - 1;
      R.rec(`Pivot is ${p} (last of positions ${lo} to ${hi}).`, 1, { pivot: hi });
      for (let j = lo; j < hi; j++) {
        R.comps++;
        R.rec(`Is ${a[j]} smaller than pivot ${p}?`, 3, { cmp: [j], pivot: hi });
        if (a[j] < p) {
          i++;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]];
            R.moves++;
            R.rec(`Yes. Move ${a[i]} to the left side.`, 4, { swp: [i, j], pivot: hi });
          }
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      R.moves++;
      R.sorted.add(i + 1);
      R.rec(`Place pivot ${p} at position ${i + 1}.`, 5, { swp: [i + 1, hi] });
      q(lo, i);
      q(i + 2, hi);
    };
    q(0, a.length - 1);
    return R.finish(6);
  },

  merge(arr) {
    const R = createRecorder(arr);
    const a = R.a;
    R.rec('Start. Split in halves, sort each half, then merge them.', 0);
    const ms = (l, r) => {
      if (l >= r) return;
      const m = (l + r) >> 1;
      R.rec(`Split positions ${l} to ${r} at ${m}.`, 1, { cmp: [l, r] });
      ms(l, m);
      ms(m + 1, r);
      const L = a.slice(l, m + 1);
      const Rt = a.slice(m + 1, r + 1);
      let i = 0;
      let j = 0;
      let k = l;
      while (i < L.length && j < Rt.length) {
        R.comps++;
        R.rec(`Compare fronts ${L[i]} and ${Rt[j]}.`, 3, { cmp: [l + i, m + 1 + j] });
        a[k] = L[i] <= Rt[j] ? L[i++] : Rt[j++];
        R.moves++;
        R.rec(`Write ${a[k]} to position ${k}.`, 4, { swp: [k] });
        k++;
      }
      while (i < L.length) {
        a[k] = L[i++];
        R.moves++;
        R.rec(`Copy leftover ${a[k]} to position ${k}.`, 5, { swp: [k] });
        k++;
      }
      while (j < Rt.length) {
        a[k] = Rt[j++];
        R.moves++;
        R.rec(`Copy leftover ${a[k]} to position ${k}.`, 5, { swp: [k] });
        k++;
      }
    };
    ms(0, a.length - 1);
    return R.finish(5);
  },

  heap(arr) {
    const R = createRecorder(arr);
    const a = R.a;
    const n = a.length;
    R.rec('Start. Build a max-heap, then keep moving the biggest stalk to the end.', 0);
    const sift = (i, sz) => {
      for (;;) {
        let b = i;
        const l = 2 * i + 1;
        const r = l + 1;
        if (l < sz) {
          R.comps++;
          R.rec(`Compare parent ${a[b]} with left child ${a[l]}.`, 4, { cmp: [b, l] });
          if (a[l] > a[b]) b = l;
        }
        if (r < sz) {
          R.comps++;
          R.rec(`Compare ${a[b]} with right child ${a[r]}.`, 4, { cmp: [b, r] });
          if (a[r] > a[b]) b = r;
        }
        if (b === i) return;
        [a[i], a[b]] = [a[b], a[i]];
        R.moves++;
        R.rec(`Swap parent down to position ${b}.`, 5, { swp: [i, b] });
        i = b;
      }
    };
    for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
    for (let e = n - 1; e > 0; e--) {
      [a[0], a[e]] = [a[e], a[0]];
      R.moves++;
      R.sorted.add(e);
      R.rec(`Move the largest, ${a[e]}, to position ${e}.`, 2, { swp: [0, e] });
      sift(0, e);
    }
    return R.finish(3);
  },

  radix(arr) {
    const R = createRecorder(arr);
    const a = R.a;
    const mx = Math.max(...a);
    R.rec('Start. Sort by the ones digit, then tens, then hundreds. No comparisons needed.', 0);
    for (let e = 1; Math.floor(mx / e) > 0; e *= 10) {
      R.rec(`Bucket every number by its digit at place ${e}.`, 1);
      const out = [];
      for (let d = 0; d < 10; d++) {
        a.forEach(v => {
          if (Math.floor(v / e) % 10 === d) out.push(v);
        });
      }
      out.forEach((v, i) => {
        a[i] = v;
        R.moves++;
        R.rec(`Collect ${v} (digit ${Math.floor(v / e) % 10}) into position ${i}.`, 2, { swp: [i] });
      });
      R.rec('That digit pass is done. On to the next digit.', 3);
    }
    return R.finish(3);
  }
};

function generateRandomArray(size = 12, min = 5, max = 99) {
  const n = Math.max(2, Math.min(size, 24));
  return Array.from({ length: n }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function validateArray(arr) {
  if (!Array.isArray(arr)) {
    return { valid: false, error: 'Input must be an array of numbers.' };
  }
  if (arr.length < 2 || arr.length > 24) {
    return { valid: false, error: 'Array length must be between 2 and 24 elements.' };
  }
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 999) {
      return { valid: false, error: 'All elements must be integers between 0 and 999.' };
    }
  }
  return { valid: true };
}

function simulateSort(algorithmKey, inputArr) {
  const algo = (algorithmKey || '').toLowerCase();
  if (!algorithms[algo]) {
    throw new Error(`Unsupported algorithm '${algorithmKey}'. Supported: ${Object.keys(algorithms).join(', ')}`);
  }

  const check = validateArray(inputArr);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const startTime = process.hrtime.bigint();
  const steps = algorithms[algo](inputArr);
  const endTime = process.hrtime.bigint();
  const executionTimeMs = Number(endTime - startTime) / 1e6;

  const lastStep = steps[steps.length - 1] || {};
  return {
    algorithm: algo,
    metadata: ALGOS_METADATA[algo],
    inputArray: inputArr,
    sortedArray: lastStep.a || inputArr,
    totalSteps: steps.length,
    totalComparisons: lastStep.comps || 0,
    totalMoves: lastStep.moves || 0,
    executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
    steps
  };
}

module.exports = {
  ALGOS_METADATA,
  algorithms,
  simulateSort,
  generateRandomArray,
  validateArray
};
