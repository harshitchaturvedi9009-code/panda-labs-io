# 🐼 Sorting Panda – Full-Stack DSA Lab Backend https://panda-labs-io.netlify.app/

A high-performance Node.js REST API backend powering the **Sorting Panda & DSA Lab** interactive visualization app.

Built with clean, modular architecture and **zero required external dependencies** (using Node.js native HTTP, WHATWG URL, and test runner), with full plug-and-play support for Express.

---

## 🚀 Quick Start

The website will start at:
- **Web App & UI**: https://panda-labs-io.netlify.app/
- **API Documentation**: https://panda-labs-io.netlify.app/
- **Health Check**: https://panda-labs-io.netlify.app/

### 2. Run Test Suite
```bash
npm test
# Or directly:
node --test test/*.test.js
```
Runs 17 comprehensive unit & integration tests across:
- All 7 sorting algorithms (Selection, Bubble, Insertion, Quick, Merge, Heap, Radix)
- Array modules (Address calculation, Insert/Delete shifts, Linear Search, Binary Search)
- HTTP REST API routing, CORS preflight, JSON serialization, and error handling

---

## 📁 Project Architecture

```
sorting-panda-backend/
├── data/                       # Persistent JSON storage
│   └── history.json            # Recorded simulation runs and benchmarks
├── public/                     # Static frontend assets
│   └── index.html              # Full-stack UI with live backend connectivity
├── src/
│   ├── controllers/
│   │   ├── arrayController.js      # Array address, insert/delete, searches
│   │   ├── benchmarkController.js  # Performance benchmarking
│   │   ├── historyController.js    # Simulation history logs
│   │   └── sortController.js       # 7 sorting algorithms & step traces
│   ├── services/
│   │   ├── arrayEngine.js          # Memory offset & array operation engine
│   │   ├── benchmarkEngine.js      # Timing & operation counter engine
│   │   ├── historyStore.js         # Persistence store (memory + JSON file)
│   │   └── sortingEngine.js        # Step-by-step trace generator for sorting
│   ├── app.js                  # HTTP dispatcher, CORS, static server, routes
│   └── server.js               # Entry point and HTTP listener
├── test/
│   ├── api.test.js             # API integration tests
│   ├── arrayEngine.test.js     # Array module tests
│   └── sortingEngine.test.js   # Sorting engine verification tests
└── package.json
```

---

## 📡 REST API Endpoints

### 🩺 System & Docs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server uptime and health status |
| `GET` | `/api/docs` | Complete API endpoint documentation |

---

### 🐼 Sorting API
| Method | Endpoint | Payload / Query | Description |
|---|---|---|---|
| `GET` | `/api/sort/algorithms` | — | Returns metadata, time/space complexities, and code for all 7 algorithms. |
| `GET` | `/api/sort/random?size=12` | `size` (optional, 2-24) | Returns a randomized array. |
| `POST` | `/api/sort/simulate` | `{"algorithm": "quick", "array": [38, 27, 43, 3, 9]}` | Computes step-by-step trace, comparisons, moves, and code line highlights. |
| `POST` | `/api/sort/simulate-all` | `{"array": [38, 27, 43, 3, 9]}` | Compares all 7 algorithms on the same array. |

#### Example: `POST /api/sort/simulate`
**Request Body:**
```json
{
  "algorithm": "bubble",
  "array": [64, 34, 25, 12, 22, 11, 90]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "algorithm": "bubble",
    "metadata": {
      "name": "Bubble",
      "best": "O(n)",
      "average": "O(n²)",
      "worst": "O(n²)",
      "extraSpace": "O(1)",
      "stable": "Yes"
    },
    "inputArray": [64, 34, 25, 12, 22, 11, 90],
    "sortedArray": [11, 12, 22, 25, 34, 64, 90],
    "totalSteps": 28,
    "totalComparisons": 21,
    "totalMoves": 5,
    "executionTimeMs": 0.154,
    "steps": [
      {
        "a": [64, 34, 25, 12, 22, 11, 90],
        "msg": "Compare 64 and 34.",
        "line": 2,
        "comps": 1,
        "moves": 0,
        "sorted": [],
        "cmp": [0, 1],
        "swp": [],
        "pivot": -1
      }
    ]
  }
}
```

---

### 🐼 Array Lab API
| Method | Endpoint | Payload | Description |
|---|---|---|---|
| `GET` | `/api/array/modules` | — | Returns documentation and theoretical formulas. |
| `POST` | `/api/array/address` | `{"base": 1000, "size": 4, "i": 3, "n": 8}` | Calculates 1D element memory address step-by-step. |
| `POST` | `/api/array/insert-delete` | `{"mode": "Insert", "arr": [10,20,30], "val": 25, "pos": 2}` | Simulates array shifting during insertion or deletion. |
| `POST` | `/api/array/linear-search` | `{"arr": [7,3,9,1,5,8], "t": 5}` | Step-by-step linear search trace. |
| `POST` | `/api/array/binary-search` | `{"arr": [1,3,5,7,8,9], "t": 7, "sortFirst": false}` | Binary search with Low/Mid/High boundary steps. |

---

### ⚡ Server Benchmark API
| Method | Endpoint | Payload | Description |
|---|---|---|---|
| `POST` | `/api/benchmark` | `{"size": 1000, "type": "random"}` | Benchmarks all 7 algorithms in pure execution time. Types: `random`, `sorted`, `reversed`, `nearly_sorted`. |

---

### 📜 History API
| Method | Endpoint | Query | Description |
|---|---|---|---|
| `GET` | `/api/history` | `?limit=20` | Returns recent simulation and benchmark logs. |
| `DELETE` | `/api/history` | — | Clears history logs. |

---

## ☁️ Deploy to Vercel

Sorting Panda is configured for zero-config Vercel deployment:
- **Frontend**: `public/index.html` is automatically served by Vercel Edge Network at `/`.
- **Backend API**: Serverless function at `api/index.js` handles all `/api/*` endpoints via `vercel.json` rewrites.

### Deploy with Vercel CLI
```bash
npm i -g vercel
vercel
```

### Deploy via GitHub
1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Click **Deploy** (no build command or output directory configuration needed).

