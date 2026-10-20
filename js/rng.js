export function createRng(seed) {
  let s = (seed >>> 0) || 1;
  function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const api = {
    next,
    getState() {
      return s >>> 0;
    },
    setState(value) {
      s = (value >>> 0) || 1;
    },
    int(min, max) {
      if (max < min) return min;
      return Math.floor(next() * (max - min + 1)) + min;
    },
    chance(p) {
      return next() < p;
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    weighted(items, weightFn) {
      const weights = items.map(weightFn);
      const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
      if (total <= 0) return api.pick(items);
      let roll = next() * total;
      for (let i = 0; i < items.length; i++) {
        roll -= Math.max(0, weights[i]);
        if (roll <= 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
  return api;
}
