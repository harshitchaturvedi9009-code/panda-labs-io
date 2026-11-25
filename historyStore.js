// History Store - In-memory and file-backed history of simulation runs

const fs = require('fs');
const path = require('path');

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);

// When running on Vercel/Lambda, use /tmp which is the writable directory
const DATA_DIR = isVercel
  ? path.join('/tmp', 'sorting-panda-data')
  : path.join(__dirname, '..', '..', 'data');

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SEED_FILE = path.join(__dirname, '..', '..', 'data', 'history.json');

let inMemoryHistory = [];

// Initialize data storage directory and load seed or saved history
try {
  if (isVercel && fs.existsSync(HISTORY_FILE)) {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    inMemoryHistory = JSON.parse(raw);
  } else if (fs.existsSync(SEED_FILE)) {
    const raw = fs.readFileSync(SEED_FILE, 'utf-8');
    inMemoryHistory = JSON.parse(raw);
  }
} catch (e) {
  inMemoryHistory = [];
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(inMemoryHistory.slice(-100), null, 2), 'utf-8');
  } catch (e) {
    // Graceful fallback to memory only
  }
}

function addEntry(entry) {
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    ...entry
  };
  inMemoryHistory.push(item);
  if (inMemoryHistory.length > 100) {
    inMemoryHistory.shift();
  }
  persist();
  return item;
}

function getRecent(limit = 20) {
  return inMemoryHistory.slice(-limit).reverse();
}

function clear() {
  inMemoryHistory = [];
  persist();
  return { success: true };
}

module.exports = {
  addEntry,
  getRecent,
  clear
};
