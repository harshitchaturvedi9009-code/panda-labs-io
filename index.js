const { handleRequest } = require('../src/app');

module.exports = async (req, res) => {
  return handleRequest(req, res);
};
