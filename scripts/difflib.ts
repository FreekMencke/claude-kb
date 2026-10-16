/**
 * Python's `difflib.SequenceMatcher.ratio()`, ported line by line, junk heuristic included. The checker's duplicate
 * warnings (check-kb.ts) were written against it, and OVERLAPS.md's reviewed pairs depend on the same scores. A port of
 * our own because the checker stays dependency-free and no npm package reproduces difflib's matching-block algorithm
 * exactly.
 *
 * Strings are compared by code point, as Python does.
 */

/** `SequenceMatcher(None, a, b).ratio()`: twice the matched characters over the total length. */
export function ratio(a: string, b: string): number {
  return new SequenceMatcher(Array.from(b)).ratio(Array.from(a));
}

/** Python's SequenceMatcher with b set once (`set_seq2`) and a passed to ratio(). */
class SequenceMatcher {
  private readonly b: string[];
  private readonly b2j = new Map<string, number[]>();

  constructor(b: string[]) {
    this.b = b;
    for (const [i, elt] of b.entries()) {
      const indices = this.b2j.get(elt);
      if (indices) indices.push(i);
      else this.b2j.set(elt, [i]);
    }
    // autojunk: in a b of 200 or more elements, drop elements that make up more than 1% of it
    if (b.length >= 200) {
      const ntest = Math.floor(b.length / 100) + 1;
      for (const [elt, indices] of [...this.b2j]) if (indices.length > ntest) this.b2j.delete(elt);
    }
  }

  ratio(a: string[]): number {
    return calculateRatio(this.matches(a), a.length + this.b.length);
  }

  /** The total size of `get_matching_blocks()`: merging adjacent blocks doesn't change it. */
  private matches(a: string[]): number {
    let total = 0;
    const queue: [number, number, number, number][] = [[0, a.length, 0, this.b.length]];
    while (queue.length) {
      const [alo, ahi, blo, bhi] = queue.pop()!;
      const [i, j, k] = this.findLongestMatch(a, alo, ahi, blo, bhi);
      if (k) {
        total += k;
        if (alo < i && blo < j) queue.push([alo, i, blo, j]);
        if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
      }
    }
    return total;
  }

  private findLongestMatch(a: string[], alo: number, ahi: number, blo: number, bhi: number): [number, number, number] {
    const { b } = this;
    let [besti, bestj, bestsize] = [alo, blo, 0];
    let j2len = new Map<number, number>();
    for (let i = alo; i < ahi; i++) {
      const newj2len = new Map<number, number>();
      for (const j of this.b2j.get(a[i]) ?? []) {
        if (j < blo) continue;
        if (j >= bhi) break;
        const k = (j2len.get(j - 1) ?? 0) + 1;
        newj2len.set(j, k);
        if (k > bestsize) [besti, bestj, bestsize] = [i - k + 1, j - k + 1, k];
      }
      j2len = newj2len;
    }
    // Extend the match by equal elements on each end. Without an isjunk function nothing is junk: the popular
    // elements autojunk dropped from b2j still extend a match.
    while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) {
      [besti, bestj, bestsize] = [besti - 1, bestj - 1, bestsize + 1];
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi && a[besti + bestsize] === b[bestj + bestsize]) bestsize++;
    return [besti, bestj, bestsize];
  }
}

function calculateRatio(matches: number, length: number): number {
  return length ? (2 * matches) / length : 1;
}
