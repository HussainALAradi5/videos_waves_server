/** Values present in every list, in the order of the first list. */
export const intersectAll = (lists: readonly string[][]): string[] => {
  if (lists.length === 0) return []
  const [first, ...rest] = lists
  const sets = rest.map((list) => new Set(list))
  return first.filter((value) => sets.every((set) => set.has(value)))
}
