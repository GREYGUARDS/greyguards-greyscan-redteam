/** Baseline the first successful feed read, including an empty feed. */
export function createInjectArrivalTracker() {
  let initialised = false;
  const known = new Set<string>();
  return {
    accept<T extends { id: string }>(list: T[]): T[] {
      const fresh = initialised ? list.filter(item => !known.has(item.id)) : [];
      list.forEach(item => known.add(item.id));
      initialised = true;
      return fresh;
    },
  };
}