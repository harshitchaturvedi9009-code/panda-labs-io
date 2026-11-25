// Benchmark Engine - Compares algorithms across array sizes and input types

function generateBenchmarkArray(size, type = 'random') {
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
  if (type === 'sorted') {
    arr.sort((a, b) => a - b);
  } else if (type === 'reversed') {
    arr.sort((a, b) => b - a);
  } else if (type === 'nearly_sorted') {
    arr.sort((a, b) => a - b);
    const swaps = Math.max(1, Math.floor(size * 0.05));
    for (let k = 0; k < swaps; k++) {
      const i = Math.floor(Math.random() * size);
      const j = Math.floor(Math.random() * size);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}

// Pure algorithm runners for performance benchmarks without UI step recordings
const fastAlgos = {
  selection(arr) {
    const a = arr.slice();
    const n = a.length;
    let comps = 0, moves = 0;
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      for (let j = i + 1; j < n; j++) {
        comps++;
        if (a[j] < a[m]) m = j;
      }
      if (m !== i) {
        [a[i], a[m]] = [a[m], a[i]];
        moves++;
      }
    }
    return { comps, moves };
  },

  bubble(arr) {
    const a = arr.slice();
    const n = a.length;
    let comps = 0, moves = 0;
    for (let i = 0; i < n - 1; i++) {
      let sw = false;
      for (let j = 0; j < n - i - 1; j++) {
        comps++;
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          moves++;
          sw = true;
        }
      }
      if (!sw) break;
    }
    return { comps, moves };
  },

  insertion(arr) {
    const a = arr.slice();
    const n = a.length;
    let comps = 0, moves = 0;
    for (let i = 1; i < n; i++) {
      const k = a[i];
      let j = i - 1;
      while (j >= 0) {
        comps++;
        if (a[j] > k) {
          a[j + 1] = a[j];
          moves++;
          j--;
        } else {
          break;
        }
      }
      a[j + 1] = k;
      moves++;
    }
    return { comps, moves };
  },

  quick(arr) {
    const a = arr.slice();
    let comps = 0, moves = 0;
    function q(lo, hi) {
      if (lo >= hi) return;
      const p = a[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        comps++;
        if (a[j] < p) {
          i++;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]];
            moves++;
          }
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      moves++;
      q(lo, i);
      q(i + 2, hi);
    }
    q(0, a.length - 1);
    return { comps, moves };
  },

  merge(arr) {
    const a = arr.slice();
    let comps = 0, moves = 0;
    function ms(l, r) {
      if (l >= r) return;
      const m = (l + r) >> 1;
      ms(l, m);
      ms(m + 1, r);
      const L = a.slice(l, m + 1);
      const Rt = a.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      while (i < L.length && j < Rt.length) {
        comps++;
        a[k++] = L[i] <= Rt[j] ? L[i++] : Rt[j++];
        moves++;
      }
      while (i < L.length) { a[k++] = L[i++]; moves++; }
      while (j < Rt.length) { a[k++] = Rt[j++]; moves++; }
    }
    ms(0, a.length - 1);
    return { comps, moves };
  },

  heap(arr) {
    const a = arr.slice();
    const n = a.length;
    let comps = 0, moves = 0;
    function sift(i, sz) {
      for (;;) {
        let b = i, l = 2 * i + 1, r = l + 1;
        if (l < sz) { comps++; if (a[l] > a[b]) b = l; }
        if (r < sz) { comps++; if (a[r] > a[b]) b = r; }
        if (b === i) return;
        [a[i], a[b]] = [a[b], a[i]];
        moves++;
        i = b;
      }
    }
    for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
    for (let e = n - 1; e > 0; e--) {
      [a[0], a[e]] = [a[e], a[0]];
      moves++;
      sift(0, e);
    }
    return { comps, moves };
  },

  radix(arr) {
    const a = arr.slice();
    const mx = Math.max(...a);
    let comps = 0, moves = 0;
    for (let e = 1; Math.floor(mx / e) > 0; e *= 10) {
      const out = [];
      for (let d = 0; d < 10; d++) {
        a.forEach(v => {
          if (Math.floor(v / e) % 10 === d) out.push(v);
        });
      }
      out.forEach((v, i) => {
        a[i] = v;
        moves++;
      });
    }
    return { comps, moves };
  }
};

function runBenchmark(options = {}) {
  const size = Math.max(10, Math.min(Number(options.size || 500), 5000));
  const type = options.type || 'random';
  const customArray = Array.isArray(options.array) && options.array.length > 0 ? options.array : null;

  const testArray = customArray || generateBenchmarkArray(size, type);
  const actualSize = testArray.length;

  const results = [];
  for (const [key, fn] of Object.entries(fastAlgos)) {
    const start = process.hrtime.bigint();
    const { comps, moves } = fn(testArray);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    results.push({
      algorithm: key,
      size: actualSize,
      inputType: customArray ? 'custom' : type,
      timeMs: Math.round(durationMs * 1000) / 1000,
      comparisons: comps,
      moves: moves
    });
  }

  // Sort results by execution time
  results.sort((a, b) => a.timeMs - b.timeMs);

  return {
    size: actualSize,
    inputType: customArray ? 'custom' : type,
    results
  };
}

module.exports = {
  runBenchmark,
  generateBenchmarkArray
};
