// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export function findLastIndex(arr: any[], fn: Function): number {
  return (arr
    .map((element, i) => [i, element])
    .filter(([i, element]) => fn(element, i, arr))
    .pop() || [-1])[0]
}
