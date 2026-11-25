const arrayEngine = require('../services/arrayEngine');
const historyStore = require('../services/historyStore');

function getModules(req, res) {
  return {
    success: true,
    modules: arrayEngine.ARRAY_MODULES_METADATA
  };
}

function address(req, res, body) {
  const result = arrayEngine.calculateAddress(body || {});
  historyStore.addEntry({
    type: 'array_address',
    inputs: result.inputs,
    result: result.result
  });
  return { success: true, data: result };
}

function insertDelete(req, res, body) {
  const result = arrayEngine.insertOrDelete(body || {});
  historyStore.addEntry({
    type: 'array_insert_delete',
    mode: result.module,
    totalOperations: result.totalOperations
  });
  return { success: true, data: result };
}

function linearSearch(req, res, body) {
  const result = arrayEngine.linearSearch(body || {});
  historyStore.addEntry({
    type: 'array_linear_search',
    target: result.target,
    found: result.found,
    comparisons: result.comparisons
  });
  return { success: true, data: result };
}

function binarySearch(req, res, body) {
  const result = arrayEngine.binarySearch(body || {});
  historyStore.addEntry({
    type: 'array_binary_search',
    target: result.target,
    found: result.found,
    comparisons: result.comparisons
  });
  return { success: true, data: result };
}

module.exports = {
  getModules,
  address,
  insertDelete,
  linearSearch,
  binarySearch
};
