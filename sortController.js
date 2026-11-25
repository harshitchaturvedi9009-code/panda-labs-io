const sortingEngine = require('../services/sortingEngine');
const historyStore = require('../services/historyStore');

function getAlgorithms(req, res) {
  return {
    success: true,
    algorithms: Object.keys(sortingEngine.ALGOS_METADATA).map(key => ({
      key,
      ...sortingEngine.ALGOS_METADATA[key]
    }))
  };
}

function getRandomArray(req, res, query) {
  const size = Number(query.size || 12);
  const arr = sortingEngine.generateRandomArray(size);
  return {
    success: true,
    size: arr.length,
    array: arr
  };
}

function simulate(req, res, body) {
  const { algorithm, array } = body || {};

  if (!algorithm) {
    throw new Error('Algorithm is required (selection, bubble, insertion, quick, merge, heap, radix).');
  }

  let inputArr = array;
  if (!inputArr) {
    inputArr = sortingEngine.generateRandomArray(12);
  }

  const result = sortingEngine.simulateSort(algorithm, inputArr);

  // Store in history
  historyStore.addEntry({
    type: 'sort',
    algorithm: result.algorithm,
    arraySize: inputArr.length,
    totalSteps: result.totalSteps,
    comparisons: result.totalComparisons,
    moves: result.totalMoves,
    executionTimeMs: result.executionTimeMs
  });

  return {
    success: true,
    data: result
  };
}

function simulateAll(req, res, body) {
  const { array } = body || {};
  let inputArr = array;
  if (!inputArr) {
    inputArr = sortingEngine.generateRandomArray(12);
  }

  const check = sortingEngine.validateArray(inputArr);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const comparison = {};
  for (const algoKey of Object.keys(sortingEngine.algorithms)) {
    const res = sortingEngine.simulateSort(algoKey, inputArr);
    comparison[algoKey] = {
      name: res.metadata.name,
      steps: res.totalSteps,
      comparisons: res.totalComparisons,
      moves: res.totalMoves,
      executionTimeMs: res.executionTimeMs
    };
  }

  return {
    success: true,
    inputArray: inputArr,
    comparison
  };
}

module.exports = {
  getAlgorithms,
  getRandomArray,
  simulate,
  simulateAll
};
