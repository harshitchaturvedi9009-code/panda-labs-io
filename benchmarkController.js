const benchmarkEngine = require('../services/benchmarkEngine');
const historyStore = require('../services/historyStore');

function run(req, res, body) {
  const result = benchmarkEngine.runBenchmark(body || {});
  historyStore.addEntry({
    type: 'benchmark',
    size: result.size,
    inputType: result.inputType,
    winner: result.results[0]?.algorithm,
    fastestTimeMs: result.results[0]?.timeMs
  });
  return {
    success: true,
    data: result
  };
}

module.exports = {
  run
};
