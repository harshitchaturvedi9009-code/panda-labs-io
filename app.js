const http = require('http');
const path = require('path');
const fs = require('fs');

const sortController = require('./controllers/sortController');
const arrayController = require('./controllers/arrayController');
const benchmarkController = require('./controllers/benchmarkController');
const historyController = require('./controllers/historyController');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, {
    success: false,
    error: message
  });
}

function handleCors(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  });
  res.end();
}

function serveStatic(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(PUBLIC_DIR, relativePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendError(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return sendError(res, 404, 'File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

function parseJsonBody(req) {
  // If running in a serverless environment like Vercel where body is already parsed
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') {
      return Promise.resolve(req.body);
    }
    if (typeof req.body === 'string') {
      if (!req.body.trim()) return Promise.resolve({});
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (e) {
        return Promise.reject(new Error('Malformed JSON body: ' + e.message));
      }
    }
    if (Buffer.isBuffer(req.body)) {
      const str = req.body.toString('utf-8');
      if (!str.trim()) return Promise.resolve({});
      try {
        return Promise.resolve(JSON.parse(str));
      } catch (e) {
        return Promise.reject(new Error('Malformed JSON body: ' + e.message));
      }
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        // Protect against massive payloads (1MB)
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Malformed JSON body: ' + e.message));
      }
    });
    req.on('error', reject);
  });
}

const startTime = Date.now();

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    return handleCors(req, res);
  }

  const headers = req.headers || {};
  // Handle Vercel or proxy URL matching where original path might be in headers
  let rawUrl = headers['x-forwarded-uri'] || headers['x-matched-path'] || req.originalUrl || req.url || '/';

  // If rawUrl is the serverless entrypoint (/api/index or /api/index.js), resolve actual route
  if (rawUrl.startsWith('/api/index')) {
    if (headers['x-matched-path'] && !headers['x-matched-path'].startsWith('/api/index')) {
      rawUrl = headers['x-matched-path'];
    } else if (req.url && !req.url.startsWith('/api/index')) {
      rawUrl = req.url;
    }
  }

  const parsedUrl = new URL(rawUrl, 'http://localhost');
  let pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/api/index' || pathname === '/api/index.js') {
    pathname = '/api';
  }

  const urlQuery = Object.fromEntries(parsedUrl.searchParams.entries());
  const query = { ...urlQuery, ...(req.query || {}) };
  const method = (req.method || 'GET').toUpperCase();

  try {
    // API Documentation & Health
    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'ok',
        app: 'Sorting Panda Backend',
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
      });
    }

    if (method === 'GET' && (pathname === '/api/docs' || pathname === '/api')) {
      return sendJson(res, 200, {
        name: 'Sorting Panda DSA Lab API',
        version: '1.0.0',
        description: 'Complete REST backend providing real-time DSA simulations, memory calculations, and algorithmic benchmarks.',
        endpoints: [
          { method: 'GET', path: '/api/health', desc: 'Server health check' },
          { method: 'GET', path: '/api/sort/algorithms', desc: 'List all 7 sorting algorithms with metadata & complexity' },
          { method: 'GET', path: '/api/sort/random?size=12', desc: 'Generate random array of given size' },
          { method: 'POST', path: '/api/sort/simulate', desc: 'Run step-by-step sorting simulation (Selection, Bubble, Insertion, Quick, Merge, Heap, Radix)' },
          { method: 'POST', path: '/api/sort/simulate-all', desc: 'Run all 7 sorting algorithms on input array for comparison' },
          { method: 'GET', path: '/api/array/modules', desc: 'List array modules & theoretical formulas' },
          { method: 'POST', path: '/api/array/address', desc: 'Calculate 1D array memory address step-by-step' },
          { method: 'POST', path: '/api/array/insert-delete', desc: 'Simulate array element insertion or deletion with shift operations' },
          { method: 'POST', path: '/api/array/linear-search', desc: 'Step-by-step linear search trace' },
          { method: 'POST', path: '/api/array/binary-search', desc: 'Step-by-step binary search trace with Low/Mid/High pointers' },
          { method: 'POST', path: '/api/benchmark', desc: 'Benchmark performance of all 7 algorithms' },
          { method: 'GET', path: '/api/history?limit=20', desc: 'Fetch recent simulations and benchmarks' },
          { method: 'DELETE', path: '/api/history', desc: 'Clear history log' }
        ]
      });
    }

    // Sort endpoints
    if (method === 'GET' && pathname === '/api/sort/algorithms') {
      return sendJson(res, 200, sortController.getAlgorithms(req, res));
    }

    if (method === 'GET' && pathname === '/api/sort/random') {
      return sendJson(res, 200, sortController.getRandomArray(req, res, query));
    }

    if (method === 'POST' && pathname === '/api/sort/simulate') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, sortController.simulate(req, res, body));
    }

    if (method === 'POST' && pathname === '/api/sort/simulate-all') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, sortController.simulateAll(req, res, body));
    }

    // Array endpoints
    if (method === 'GET' && pathname === '/api/array/modules') {
      return sendJson(res, 200, arrayController.getModules(req, res));
    }

    if (method === 'POST' && pathname === '/api/array/address') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, arrayController.address(req, res, body));
    }

    if (method === 'POST' && pathname === '/api/array/insert-delete') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, arrayController.insertDelete(req, res, body));
    }

    if (method === 'POST' && pathname === '/api/array/linear-search') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, arrayController.linearSearch(req, res, body));
    }

    if (method === 'POST' && pathname === '/api/array/binary-search') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, arrayController.binarySearch(req, res, body));
    }

    // Benchmark endpoint
    if (method === 'POST' && pathname === '/api/benchmark') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, benchmarkController.run(req, res, body));
    }

    // History endpoints
    if (method === 'GET' && pathname === '/api/history') {
      return sendJson(res, 200, historyController.getRecent(req, res, query));
    }

    if (method === 'DELETE' && pathname === '/api/history') {
      return sendJson(res, 200, historyController.clear(req, res));
    }

    // Fallthrough: Serve static assets (HTML/CSS/JS) if not an API route
    if (!pathname.startsWith('/api/')) {
      return serveStatic(req, res, pathname);
    }

    // Unknown API route
    return sendError(res, 404, `API route not found: ${method} ${pathname}`);
  } catch (err) {
    return sendError(res, 400, err.message || 'Internal server error');
  }
}

module.exports = {
  handleRequest
};
