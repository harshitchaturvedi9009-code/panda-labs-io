const historyStore = require('../services/historyStore');

function getRecent(req, res, query) {
  const limit = Math.min(Number(query.limit || 20), 100);
  return {
    success: true,
    data: historyStore.getRecent(limit)
  };
}

function clear(req, res) {
  return historyStore.clear();
}

module.exports = {
  getRecent,
  clear
};
