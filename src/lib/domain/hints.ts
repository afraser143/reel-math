/**
 * "Guide tips" shown when a fact is missed: a strategy, not just the answer.
 * Built from the easier of the two factors so the trick is always one he knows.
 */
export function guideTip(a: number, b: number): string {
  const product = a * b;
  // Lead with the factor that has the friendliest trick.
  const easeOrder = [1, 10, 2, 5, 11, 9, 4, 3, 6, 8, 12, 7];
  const [k, n] = easeOrder.indexOf(a) <= easeOrder.indexOf(b) ? [a, b] : [b, a];

  switch (k) {
    case 1:
      return `Anything times 1 stays the same: ${n} × 1 = ${n}.`;
    case 10:
      return `Times 10? Just add a zero to ${n}: ${product}.`;
    case 2:
      return `Times 2 means double it: ${n} + ${n} = ${product}.`;
    case 5:
      return `Times 5 is half of times 10: ${n} × 10 = ${n * 10}, half of that is ${product}.`;
    case 11:
      return n <= 9
        ? `Times 11 up to 9, the digit repeats: ${n} and ${n} make ${product}.`
        : `${n} × 10 = ${n * 10}, plus one more ${n} = ${product}.`;
    case 9:
      return `Times 9: do ${n} × 10 = ${n * 10}, then take away one ${n}: ${product}.`;
    case 4:
      return `Times 4 is double, then double again: ${n} → ${n * 2} → ${product}.`;
    case 3:
      return `Times 3 is double plus one more: ${n * 2} + ${n} = ${product}.`;
    case 6:
      return `Times 6 is times 5 plus one more: ${n * 5} + ${n} = ${product}.`;
    case 8:
      return `Times 8 is double three times: ${n} → ${n * 2} → ${n * 4} → ${product}.`;
    case 12:
      return `Times 12 is times 10 plus times 2: ${n * 10} + ${n * 2} = ${product}.`;
    default:
      return `Times 7 is times 5 plus times 2: ${n * 5} + ${n * 2} = ${product}.`;
  }
}
