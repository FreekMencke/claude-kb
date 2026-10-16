/**
 * Python's `difflib.SequenceMatcher.ratio()` and `difflib.get_close_matches()`, ported line by line, junk heuristic
 * included. The checker's duplicate warnings (check-kb.ts) and kb_get's closest-ID suggestions (mcp-server/kb-tools.ts)
 * were written against them and must keep giving the same answers. A port of our own because the checker stays
 * dependency-free and no npm package reproduces difflib's matching-block algorithm exactly.
 *
 * Strings are compared by code point, as Python does.
 */

/** `SequenceMatcher(None, a, b).ratio()`: twice the matched characters over the total length. */
export function ratio(a: string, b: string): number {
  return new SequenceMatcher(Array.from(a), Array.from(b)).ratio();
}

/**
 * `get_close_matches(word, possibilities, n, cutoff)`: the n possibilities closest to word with a ratio of at least
 * cutoff, best first; ties go to the greater string, as Python's `heapq.nlargest` on (ratio, string) pairs does.
 */
export function closeMatches(word: string, possibilities: Iterable<string>, n = 3, cutoff = 0.6): string[] {
  const b = Array.from(word);
  const scored: [number, string][] = [];
  for (const x of possibilities) {
    const score = new SequenceMatcher(Array.from(x), b).ratio();
    if (score >= cutoff) scored.push([score, x]);
  }
  scored.sort(([sa, xa], [sb, xb]) => sb - sa || (xb > xa ? 1 : xb < xa ? -1 : 0));
  return scored.slice(0, n).map(([, x]) => x);
}

class SequenceMatcher {
  private readonly a: string[];
  private readonly b: string[];
  private readonly b2j = new Map<string, number[]>();

  constructor(a: string[], b: string[]) {
    this.a = a;
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

  ratio(): number {
    const length = this.a.length + this.b.length;
    return length ? (2 * this.matches()) / length : 1;
  }

  /** The total size of `get_matching_blocks()`: merging adjacent blocks doesn't change it. */
  private matches(): number {
    let total = 0;
    const queue: [number, number, number, number][] = [[0, this.a.length, 0, this.b.length]];
    while (queue.length) {
      const [alo, ahi, blo, bhi] = queue.pop()!;
      const [i, j, k] = this.findLongestMatch(alo, ahi, blo, bhi);
      if (k) {
        total += k;
        if (alo < i && blo < j) queue.push([alo, i, blo, j]);
        if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
      }
    }
    return total;
  }

  private findLongestMatch(alo: number, ahi: number, blo: number, bhi: number): [number, number, number] {
    const { a, b } = this;
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
