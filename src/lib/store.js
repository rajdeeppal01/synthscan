// Simple in-memory store for analysis results (development)
// In production, use Redis or a database

const store = new Map();

// Auto-clean entries older than 1 hour
function cleanup() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now - value.createdAt > 3600000) {
      store.delete(key);
    }
  }
}

export function saveResult(id, data) {
  cleanup();
  store.set(id, { ...data, createdAt: Date.now() });
}

export function getResult(id) {
  return store.get(id) || null;
}
