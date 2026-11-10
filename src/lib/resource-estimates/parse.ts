/**
 * Pure parsing helpers for resource-estimate data. No Node APIs, so they can
 * be unit-tested and reused anywhere.
 */

const NUM_RE = /\d[\d,]*(?:\.\d+)?(?:[eE][+-]?\d+|\s*(?:\^|\*\*)\s*\d+)?/g;
const POW_RE = /^(\d+(?:\.\d+)?)\s*(?:\^|\*\*)\s*(\d+)$/;
const RANGE_RE = /\d\s*(?:-|–|—|to)\s*\d/;
const ARXIV_RE = /(\d{4}\.\d{4,5})(v\d+)?/;

function toFloat(token: string): number {
  const t = token.replace(/,/g, "").trim();
  const pow = POW_RE.exec(t);
  return pow ? Number(pow[1]) ** Number(pow[2]) : Number(t);
}

/**
 * Parse a qubits/gates value. Returns [plotValue, displayText], or null if it
 * is not a positive finite number. Ranges such as "2375 – 6652" plot at the
 * geometric mean (the midpoint on a log axis). Text with two numbers but no
 * range separator is ambiguous and returns null rather than guessing.
 */
export function parseQuantity(value: number | string): [number, string] | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0
      ? [value, value.toLocaleString("en-US", { maximumFractionDigits: 0 })]
      : null;
  }
  const text = value.trim();
  if (!text || /^[-−]/.test(text)) return null; // the regex ignores signs; reject "-5"
  const nums = [...text.matchAll(NUM_RE)].map((m) => toFloat(m[0]));
  let v: number;
  if (nums.length === 1) v = nums[0];
  else if (nums.length === 2 && RANGE_RE.test(text))
    v = Math.min(...nums) > 0 ? Math.sqrt(nums[0] * nums[1]) : 0;
  else return null;
  return Number.isFinite(v) && v > 0 ? [v, text] : null;
}

/** The bare arXiv ID in an ID, "arXiv:ID", or arxiv.org URL (version dropped). */
export function arxivId(ref: string): string | null {
  const m = ARXIV_RE.exec(ref);
  return m ? m[1] : null;
}

/** Link for an arXiv ID or full URL. */
export function referenceUrl(ref: string): string | null {
  const text = ref.trim();
  if (!text) return null;
  if (/^https?:\/\//.test(text)) return text.split(/\s/)[0];
  const id = arxivId(text);
  return id ? `https://arxiv.org/abs/${id}` : null;
}

/**
 * Recover an arXiv ID that YAML read as a number (unquoted `2001.09580` →
 * 2001.0958, `0704.0001` → 704.0001). IDs since 2015 have five digits after
 * the dot, older ones four; zero-pad both sides. Returns null if `ref` can't
 * be an arXiv ID.
 */
export function idFromNumber(ref: number): string | null {
  if (Number.isInteger(ref) || ref < 701 || ref >= 10000) return null;
  const digits = ref >= 1501 ? 5 : 4;
  const [whole, frac] = ref.toFixed(digits).split(".");
  return `${whole.padStart(4, "0")}.${frac}`;
}
