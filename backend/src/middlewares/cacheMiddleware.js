const { getCache, setCache, clearCache } = require('@/utils/cache');

// Middleware to check if data is in the cache for GET requests
exports.checkCache = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Use the full URL including query params as the cache key
  const key = req.originalUrl || req.url;
  const cachedData = getCache(key);

  if (cachedData) {
    // console.log(`[Cache Hit] Serving from cache: ${key}`);
    return res.status(200).json(cachedData);
  }

  // Intercept the res.json method to store the result before sending
  const originalJson = res.json;

  res.json = function (body) {
    // Only cache successful requests
    if (res.statusCode >= 200 && res.statusCode < 300 && body.success !== false) {
      // console.log(`[Cache Miss] Saving to cache: ${key}`);
      // Use JSON.parse(JSON.stringify(body)) to ensure we store a Plain Old JavaScript Object
      // This avoids Mongoose document traversal errors during serialization
      try {
        const pojoBody = JSON.parse(JSON.stringify(body));
        setCache(key, pojoBody);
      } catch (err) {
        // Fallback or ignore caching if body is circular (highly unlikely for standard API responses)
        console.error('[Cache] Serialization error:', err.message);
      }
    }
    // Call the original res.json method to send the response to the client
    return originalJson.call(this, body);
  };

  next();
};

// Middleware wrapper to clear cache for specific entities
// e.g., clearCacheMiddleware("solarproject")
exports.clearCacheOnUpdate = (entity) => {
  return (req, res, next) => {
    // Execute after the route handler finishes
    res.on('finish', () => {
      // If the update/create/delete was successful, flush the cache for that entity
      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearCache(entity);
      }
    });
    next();
  };
};
