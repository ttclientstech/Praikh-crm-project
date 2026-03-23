function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    console.error(e.message);
    return false;
  }
  return true;
}

export const sessionStorageHealthCheck = async () => {
  for (var i = 0; i < window.sessionStorage.length; ++i) {
    try {
      const result = window.sessionStorage.getItem(window.sessionStorage.key(i));
      if (!isJsonString(result)) {
        window.sessionStorage.removeItem(window.sessionStorage.key(i));
      }
      if (result && Object.keys(window.sessionStorage.key(i)).length == 0) {
        window.sessionStorage.removeItem(window.sessionStorage.key(i));
      }
    } catch (error) {
      window.sessionStorage.clear();
      // Handle the exception here
      console.error('window.sessionStorage Exception occurred:', error);
      // You can choose to ignore certain exceptions or take other appropriate actions
    }
  }
};

export const storePersist = {
  set: (key, state) => {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  },
  get: (key) => {
    const result = window.sessionStorage.getItem(key);
    if (!result) {
      return false;
    } else {
      if (!isJsonString(result)) {
        window.sessionStorage.removeItem(key);
        return false;
      } else return JSON.parse(result);
    }
  },
  remove: (key) => {
    window.sessionStorage.removeItem(key);
  },
  getAll: () => {
    return window.sessionStorage;
  },
  clear: () => {
    window.sessionStorage.clear();
  },
};

export default storePersist;
