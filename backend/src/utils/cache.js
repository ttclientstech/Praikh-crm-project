const NodeCache = require('node-cache');

// stdTTL: 0 means unlimited (we invalidate manually on update/delete)
// checkperiod: 0 means no periodic checks since items don't expire time-wise
const myCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

const getCache = (key) => {
  return myCache.get(key);
};

const setCache = (key, data, ttl = 0) => {
  myCache.set(key, data, ttl);
};

const clearCache = (entity) => {
  // Get all keys currently in the cache
  const allKeys = myCache.keys();
  
  // Find keys that contain the entity name in their path
  // E.g., /api/solarproject/list, /api/solarproject/summary
  // We use a regex or string includes to match the entity in the route path
  const keysToDelete = allKeys.filter((key) => {
    return key.toLowerCase().includes(`/${entity.toLowerCase()}/`);
  });

  if (keysToDelete.length > 0) {
    myCache.del(keysToDelete);
    console.log(`[Cache] Cleared ${keysToDelete.length} keys for entity: ${entity}`);
  }
};

const clearAllCache = () => {
  myCache.flushAll();
  console.log('[Cache] Flushed all cache');
};

module.exports = {
  myCache,
  getCache,
  setCache,
  clearCache,
  clearAllCache,
};
