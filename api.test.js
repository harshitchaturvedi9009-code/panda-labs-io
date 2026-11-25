const test = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const { Writable } = require('node:stream');
const { handleRequest } = require('../src/app');

function invokeApi(method, pathname, body = null) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = pathname;

    const res = {
      statusCode: 200,
      headers: {},
      writeHead(code, headers) {
        this.statusCode = code;
        this.headers = headers || {};
      },
      end(payload) {
        let parsed = payload;
        try {
          if (payload) parsed = JSON.parse(payload);
        } catch (e) {
          parsed = payload;
        }
        resolve({ statusCode: this.statusCode, headers: this.headers, body: parsed });
      }
    };

    handleRequest(req, res).catch(reject);

    if (body) {
      const jsonStr = typeof body === 'string' ? body : JSON.stringify(body);
      req.emit('data', Buffer.from(jsonStr));
    }
    req.emit('end');
  });
}

test('API Controller & Routes', async t => {
  await t.test('GET /api/health returns 200 ok', async () => {
    const res = await invokeApi('GET', '/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await t.test('GET /api/docs returns API documentation', async () => {
    const res = await invokeApi('GET', '/api/docs');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.endpoints));
    assert.ok(res.body.endpoints.length >= 10);
  });

  await t.test('GET /api/sort/algorithms lists 7 algorithms', async () => {
    const res = await invokeApi('GET', '/api/sort/algorithms');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.algorithms.length, 7);
  });

  await t.test('POST /api/sort/simulate simulates sorting', async () => {
    const res = await invokeApi('POST', '/api/sort/simulate', {
      algorithm: 'quick',
      array: [20, 5, 80, 15, 3]
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.deepStrictEqual(res.body.data.sortedArray, [3, 5, 15, 20, 80]);
    assert.ok(res.body.data.steps.length > 0);
  });

  await t.test('POST /api/sort/simulate-all compares all 7 algorithms', async () => {
    const res = await invokeApi('POST', '/api/sort/simulate-all', {
      array: [30, 10, 50, 20, 40]
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Object.keys(res.body.comparison).length, 7);
  });

  await t.test('POST /api/array/address calculates memory address', async () => {
    const res = await invokeApi('POST', '/api/array/address', {
      base: 1000,
      size: 4,
      i: 2,
      n: 5
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.result.address, 1008);
  });

  await t.test('POST /api/array/linear-search finds target', async () => {
    const res = await invokeApi('POST', '/api/array/linear-search', {
      arr: [5, 15, 25, 35],
      t: 25
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.found, true);
    assert.strictEqual(res.body.data.index, 2);
  });

  await t.test('POST /api/benchmark runs algorithm benchmark', async () => {
    const res = await invokeApi('POST', '/api/benchmark', {
      size: 50,
      type: 'random'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.results.length, 7);
  });

  await t.test('GET /api/history returns recent runs', async () => {
    const res = await invokeApi('GET', '/api/history?limit=5');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('GET /api returns docs alias for root API route', async () => {
    const res = await invokeApi('GET', '/api');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.endpoints));
  });

  await t.test('Vercel serverless pre-parsed req.body support', async () => {
    const res = await new Promise((resolve, reject) => {
      const req = {
        method: 'POST',
        url: '/api/sort/simulate',
        headers: {},
        body: {
          algorithm: 'bubble',
          array: [9, 1, 4]
        }
      };
      const response = {
        statusCode: 200,
        headers: {},
        writeHead(code, headers) {
          this.statusCode = code;
          this.headers = headers || {};
        },
        end(payload) {
          let parsed = payload;
          try {
            if (payload) parsed = JSON.parse(payload);
          } catch (e) {
            parsed = payload;
          }
          resolve({ statusCode: this.statusCode, headers: this.headers, body: parsed });
        }
      };
      handleRequest(req, response).catch(reject);
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.deepStrictEqual(res.body.data.sortedArray, [1, 4, 9]);
  });

  await t.test('Vercel entrypoint api/index.js handles requests with proxy headers', async () => {
    const vercelHandler = require('../api/index');
    const res = await new Promise((resolve, reject) => {
      const req = {
        method: 'GET',
        url: '/api/index.js',
        headers: {
          'x-matched-path': '/api/health'
        }
      };
      const response = {
        statusCode: 200,
        headers: {},
        writeHead(code, headers) {
          this.statusCode = code;
          this.headers = headers || {};
        },
        end(payload) {
          let parsed = payload;
          try {
            if (payload) parsed = JSON.parse(payload);
          } catch (e) {
            parsed = payload;
          }
          resolve({ statusCode: this.statusCode, headers: this.headers, body: parsed });
        }
      };
      vercelHandler(req, response).catch(reject);
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await t.test('GET / serves index.html via static fallback', async () => {
    const res = new Writable({
      write(chunk, encoding, callback) {
        this.data = (this.data || '') + chunk.toString();
        callback();
      }
    });
    res.statusCode = 200;
    res.headers = {};
    res.writeHead = function(code, headers) {
      this.statusCode = code;
      this.headers = headers || {};
    };

    await new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      const req = new EventEmitter();
      req.method = 'GET';
      req.url = '/';
      handleRequest(req, res).catch(reject);
      req.emit('end');
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['Content-Type'].includes('text/html'));
    assert.ok(res.data.includes('Sorting Panda'));
  });
});
