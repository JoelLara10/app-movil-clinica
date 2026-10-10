const memoryCache = new Map();

export const getAdminCache = async (key, maxAge) => {
  let cached = memoryCache.get(key);

  if (!cached?.timestamp || cached.data === undefined) {
    return null;
  }

  return {
    data: cached.data,
    timestamp: cached.timestamp,
    isFresh: Date.now() - cached.timestamp < maxAge,
  };
};

export const setAdminCache = async (key, data) => {
  const cached = {
    data,
    timestamp: Date.now(),
  };

  memoryCache.set(key, cached);

  return cached;
};

export const clearAdminCache = async () => {
  memoryCache.clear();
};

