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
  return new SequenceMatcher(Array.from(b)).ratio(Array.from(a));
}

/**
 * `get_close_matches(word, possibilities, n, cutoff)`: the n possibilities closest to word with a ratio of at least
 * cutoff, best first; ties go to the greater string, as Python's `heapq.nlargest` on (ratio, string) pairs does.
 */
export function closeMatches(word: string, possibilities: Iterable<string>, n = 3, cutoff = 0.6): string[] {
  // As Python does: word's index is built once, and two cheap upper bounds skip most possibilities before the full
  // ratio. They can't change the result, but without them a burst of unknown IDs in kb_get doubled the server's memory
  const matcher = new SequenceMatcher(Array.from(word));
  const scored: [number, string][] = [];
  for (const x of possibilities) {
    const a = Array.from(x);
    if (matcher.realQuickRatio(a) < cutoff || matcher.quickRatio(a) < cutoff) continue;
    const score = matcher.ratio(a);
    if (score >= cutoff) scored.push([score, x]);
  }
  scored.sort(([sa, xa], [sb, xb]) => sb - sa || (xb > xa ? 1 : xb < xa ? -1 : 0));
  return scored.slice(0, n).map(([, x]) => x);
}

/** Python's SequenceMatcher with b set once (`set_seq2`) and a passed to each ratio, as get_close_matches uses it. */
class SequenceMatcher {
  private readonly b: string[];
  private readonly b2j = new Map<string, number[]>();
  private fullbcount: Map<string, number> | undefined;

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

  /** An upper bound on ratio(): the characters a and b share, in any order. */
  quickRatio(a: string[]): number {
    if (!this.fullbcount) {
      this.fullbcount = new Map();
      for (const elt of this.b) this.fullbcount.set(elt, (this.fullbcount.get(elt) ?? 0) + 1);
    }
    const avail = new Map<string, number>();
    let matches = 0;
    for (const elt of a) {
      const numb = avail.get(elt) ?? this.fullbcount.get(elt) ?? 0;
      avail.set(elt, numb - 1);
      if (numb > 0) matches++;
    }
    return calculateRatio(matches, a.length + this.b.length);
  }

  /** A looser, cheaper upper bound on ratio(): from the lengths alone. */
  realQuickRatio(a: string[]): number {
    return calculateRatio(Math.min(a.length, this.b.length), a.length + this.b.length);
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
