import {
  Assert,
} from '../abstract-ops/all.mjs';
import {
  Value,
} from '../value.mjs';

// 21.2.2.1 #sec-notation
export function getMatcher(parsedRegex, patternCharacters, flags) {
  const {
    pattern,
    nCapturingParens: NcapturingParens,
  } = parsedRegex;
  const DotAll = flags.includes('s');
  const IgnoreCase = flags.includes('i');
  const Multiline = flags.includes('m');
  const Unicode = flags.includes('u');

  function Evaluate_Pattern(Pattern) {
    return (str, index) => {
      const mainM = Evaluate_Disjunction(Pattern.Disjunction, 1);
      Assert(index <= str.length);
      const Input = Unicode ? Array.from(str) : str.split('');
      const InputLength = Input.length;
      // TODO: Let listIndex be the index into Input of the character that was obtained from element index of str.
      const listIndex = index;
      const mainC = (state) => state;
      const cap = new Array(NcapturingParens).fill(Value.undefined);
      const mainX = new State(listIndex, cap);
      return mainM(mainX, mainC);

      // 21.2.2.3 #sec-disjunction
      function Evaluate_Disjunction(Disjunction, direction) {
        if (Disjunction.Alternatives.length === 1) {
          const m = Evaluate_Alternative(Disjunction.Alternatives[0], direction);
          return m;
        } else {
          const M = Disjunction.Alternatives.map((Alternative) => Evaluate_Alternative(Alternative, direction));
          return (x, c) => {
            for (const m of M) {
              const r = m(x, c);
              if (r !== MatchResultFailure) {
                return r;
              }
            }
            return MatchResultFailure;
          };
        }
      }

      // 21.2.2.4 #sec-alternative
      function Evaluate_Alternative(Alternative, direction) {
        if (Alternative.Terms.length === 0) {
          return (x, c) => c(x);
        } else if (Alternative.Terms.length === 1) {
          return Evaluate_Term(Alternative.Terms[0], direction);
        } else {
          const M = Alternative.Terms.map((Term) => Evaluate_Term(Term, direction));
          if (direction === 1) {
            return (x, c) => {
              const d = M.slice(1).reduceRight((prev, cur) => (y) => cur(y, prev), c);
              return M[0](x, d);
            };
          } else {
            Assert(direction === -1);
            return (x, c) => {
              const d = M.slice(0, -1).reduce((prev, cur) => (y) => cur(y, prev), c);
              return M[M.length - 1](x, d);
            };
          }
        }
      }

      // 21.2.2.5 #sec-term
      function Evaluate_Term(Term, direction) {
        if (Term.subtype === 'Assertion') {
          return (x, c) => {
            const t = Evaluate_Assertion(Term.Assertion);
            const r = t(x);
            if (r === false) {
              return MatchResultFailure;
            }
            return c(x);
          };
        } else if (Term.subtype === 'Atom') {
          return Evaluate_Atom(Term.Atom, direction);
        } else {
          const m = Evaluate_Atom(Term.Atom, direction);
          const { max, min, greedy } = Term.Quantifier;
          Assert(!Number.isFinite(max) || max >= min);
          // TODO: Let parenIndex be the number of left-capturing parentheses in the entire regular expression that occur to the left of this Term. This is the total number of Atom :: `(` GroupSpecifierDisjunction `)` Parse Nodes prior to or enclosing this Term.
          // TODO: Let parenCount be the number of left-capturing parentheses in Atom. This is the total number of Atom :: `(` GroupSpecifierDisjunction `)` Parse Nodes enclosed by Atom.
          return (x, c) => RepeatMatcher(m, min, max, greedy, x, c, parenIndex, parenCount);
        }
      }

      // 21.2.2.5.1 #sec-runtime-semantics-repeatmatcher-abstract-operation
      function RepeatMatcher(m, min, max, greedy, x, c, parenIndex, parenCount) {
        if (max === 0) {
          return c(x);
        }
        const d = (y) => {
          if (min === 0 && y.endIndex === x.endIndex) {
            return MatchResultFailure;
          }
          const min2 = min === 0 ? 0 : min - 1;
          const max2 = max === Infinity ? Infinity : max - 1;
          return RepeatMatcher(m, min2, max2, greedy, y, c, parenIndex, parenCount);
        };
        const cap = [...x.captures];
        // TODO: For each integer k that satisfies parenIndex < k and k ≤ parenIndex + parenCount, set cap[k] to undefined.
        const e = x.endIndex;
        const xr = new State(e, cap);
        if (min !== 0) {
          return m(xr, d);
        }
        if (greedy === false) {
          const z = c(x);
          if (z !== MatchResultFailure) {
            return z;
          }
          return m(xr, d);
        }
        const z = m(xr, d);
        if (z !== MatchResultFailure) {
          return z;
        }
        return c(x);
      }

      // 21.2.2.8 #sec-atom
      function Evaluate_Atom(Atom, direction) {
        if (Atom.subtype === 'PatternCharacter') {
          const ch = Atom.PatternCharacter;
          const A = CharSet(ch);
          return CharacterSetMatcher(A, false, direction);
        }
      }

      function CharSet(char) {
        return [char];
      }

      function charSetHas(charset, cc) {
        return charset.some((char) => Canonicalize(char) === cc);
      }

      // 21.2.2.8.1 #sec-runtime-semantics-charactersetmatcher-abstract-operation
      function CharacterSetMatcher(A, invert, direction) {
        return (x, c) => {
          const e = x.endIndex;
          const f = e + direction;
          if (f < 0 || f > InputLength) {
            return MatchResultFailure;
          }
          const index = Math.min(e, f);
          const ch = Input[index];
          const cc = Canonicalize(ch);
          if (invert === false) {
            if (!charSetHas(A, cc)) {
              return MatchResultFailure;
            }
          } else {
            Assert(invert === true);
            if (charSetHas(A, cc)) {
              return MatchResultFailure;
            }
          }
          const cap = x.captures;
          const y = new State(f, cap);
          return c(y);
        };
      }

      // 21.2.2.8.2 #sec-runtime-semantics-canonicalize-ch
      function Canonicalize(ch) {
        if (IgnoreCase === false) {
          return ch;
        }

        if (Unicode === true) {
          // TODO: If the file CaseFolding.txt of the Unicode Character Database provides a simple or common case folding mapping for ch, return the result of applying that mapping to ch.
          return ch;
        } else {
          // TODO
        }
      }
    };
  }

  return Evaluate_Pattern(pattern);
}

class MatchResult {}

export class State extends MatchResult {
  constructor(endIndex, captures) {
    super();
    this.endIndex = endIndex;
    this.captures = captures;
  }
}

export const MatchResultFailure = new MatchResult();
