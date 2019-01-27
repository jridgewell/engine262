import {
  Assert,
} from '../abstract-ops/all.mjs';
import {
  Value,
} from '../value.mjs';
import {
  isLineTerminator,
  isStrWhiteSpaceChar,
} from '../grammar/util.mjs';

// 21.2.2.1 #sec-notation
export function getMatcher(parsedRegex, patternCharacters, flags) {
  console.log(require('util').inspect(parsedRegex, { depth: Infinity, colors: true }));
  const {
    pattern,
    nCapturingParens: NcapturingParens,
  } = parsedRegex;
  const DotAll = flags.includes('s');
  const IgnoreCase = flags.includes('i');
  const Multiline = flags.includes('m');
  const Unicode = flags.includes('u');

  return Evaluate_Pattern(pattern);

  function Evaluate_Pattern(Pattern) {
    return (str, mainIndex) => {
      const mainM = Evaluate_Disjunction(Pattern.Disjunction, 1);
      Assert(mainIndex <= str.length);
      const Input = Unicode ? Array.from(str) : str.split('');
      const InputLength = Input.length;
      // TODO: Let listIndex be the index into Input of the character that was obtained from element index of str.
      const listIndex = mainIndex;
      const mainC = (state) => state;
      const mainCap = new Array(NcapturingParens).fill(Value.undefined);
      const mainX = new State(listIndex, mainCap);
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
          const { max, min, greedy } = Evaluate_Quantifier(Term.Quantifier);
          Assert(!Number.isFinite(max) || max >= min);
          // TODO: Let parenIndex be the number of left-capturing parentheses in the entire regular expression that occur to the left of this Term. This is the total number of Atom :: `(` GroupSpecifierDisjunction `)` Parse Nodes prior to or enclosing this Term.
          const parenIndex = 0;
          // TODO: Let parenCount be the number of left-capturing parentheses in Atom. This is the total number of Atom :: `(` GroupSpecifierDisjunction `)` Parse Nodes enclosed by Atom.
          const parenCount = 0;
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

      // 21.2.2.6 #sec-assertion
      function Evaluate_Assertion(Assertion) {
        if (Assertion.subtype === '^') {
          return (x) => {
            const e = x.endIndex;
            if (e === 0) {
              return true;
            }
            if (Multiline === false) {
              return false;
            }
            if (isLineTerminator(Input[e - 1])) {
              return true;
            }
            return false;
          };
        }

        if (Assertion.subtype === '$') {
          return (x) => {
            const e = x.endIndex;
            if (e === InputLength) {
              return true;
            }
            if (Multiline === false) {
              return false;
            }
            if (isLineTerminator(Input[e])) {
              return true;
            }
            return false;
          };
        }

        if (Assertion.subtype === '\\b') {
          return (x) => {
            const e = x.endIndex;
            const a = IsWordChar(e - 1);
            const b = IsWordChar(e);
            if (a === true && b === false) {
              return true;
            }
            if (a === false && b === true) {
              return true;
            }
            return false;
          };
        }

        if (Assertion.subtype === '\\B') {
          return (x) => {
            const e = x.endIndex;
            const a = IsWordChar(e - 1);
            const b = IsWordChar(e);
            if (a === true && b === false) {
              return false;
            }
            if (a === false && b === true) {
              return false;
            }
            return true;
          };
        }

        if (Assertion.subtype === '(?=') {
          const m = Evaluate_Disjunction(Assertion.Disjunction, 1);
          return (x, c) => {
            const d = (state) => state;
            const r = m(x, d);
            if (r === MatchResultFailure) {
              return MatchResultFailure;
            }
            const y = r;
            const cap = y.captures;
            const xe = x.endIndex;
            const z = new State(xe, cap);
            return c(z);
          };
        }

        if (Assertion.subtype === '(?!') {
          const m = Evaluate_Disjunction(Assertion.Disjunction, 1);
          return (x, c) => {
            const d = (state) => state;
            const r = m(x, d);
            if (r !== MatchResultFailure) {
              return MatchResultFailure;
            }
            return c(x);
          };
        }

        if (Assertion.subtype === '(?<=') {
          const m = Evaluate_Disjunction(Assertion.Disjunction, -1);
          return (x, c) => {
            const d = (state) => state;
            const r = m(x, d);
            if (r === MatchResultFailure) {
              return MatchResultFailure;
            }
            const y = r;
            const cap = y.captures;
            const xe = x.endIndex;
            const z = new State(xe, cap);
            return c(z);
          };
        }

        if (Assertion.subtype === '(?<!') {
          const m = Evaluate_Disjunction(Assertion.Disjunction, -1);
          return (x, c) => {
            const d = (state) => state;
            const r = m(x, d);
            if (r !== MatchResultFailure) {
              return MatchResultFailure;
            }
            return c(x);
          };
        }
      }

      // 21.2.2.6.1 #sec-runtime-semantics-wordcharacters-abstract-operation
      function WordCharacters() {
        const A = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_'];
        // TODO
        // const U = [];
        // For each character c not in set A where Canonicalize(c) is in A, add c to U.
        // Assert: Unless Unicode and IgnoreCase are both true, U is empty.
        // Add the characters in set U to set A.
        return (cc) => A.includes(cc);
      }

      // 21.2.2.6.2 #sec-runtime-semantics-iswordchar-abstract-operation
      function IsWordChar(e) {
        if (e === -1 || e === InputLength) {
          return false;
        }
        const c = Input[e];
        const wordChars = WordCharacters();
        if (wordChars.includes(c)) {
          return true;
        }
        return false;
      }

      // 21.2.2.7 #sec-quantifier
      function Evaluate_Quantifier(Quantifier) {
        if (Quantifier.greedy) {
          const { min, max } = Evaluate_QuantifierPrefix(Quantifier.QuantifierPrefix);
          return { min, max, greedy: true };
        } else {
          const { min, max } = Evaluate_QuantifierPrefix(Quantifier.QuantifierPrefix);
          return { min, max, greedy: false };
        }
      }

      function Evaluate_QuantifierPrefix(QuantifierPrefix) {
        if (QuantifierPrefix.subtype === '*') {
          return { min: 0, max: Infinity };
        }

        if (QuantifierPrefix.subtype === '+') {
          return { min: 1, max: Infinity };
        }

        if (QuantifierPrefix.subtype === '?') {
          return { min: 0, max: 1 };
        }

        if (QuantifierPrefix.subtype === 'fixed') {
          const i = QuantifierPrefix.DecimalDigits;
          return { min: i, max: i };
        }

        if (QuantifierPrefix.subtype === 'start') {
          const i = QuantifierPrefix.DecimalDigits;
          return { min: i, max: Infinity };
        }

        if (QuantifierPrefix.subtype === 'range') {
          const i = QuantifierPrefix.DecimalDigits1;
          const j = QuantifierPrefix.DecimalDigits2;
          return { min: i, max: j };
        }
      }

      // 21.2.2.8 #sec-atom
      function Evaluate_Atom(Atom, direction) {
        if (Atom.subtype === 'PatternCharacter') {
          const ch = Atom.PatternCharacter;
          const A = singleCharSet(ch);
          return CharacterSetMatcher(A, false, direction);
        }

        if (Atom.subtype === '.') {
          let A;
          if (DotAll === true) {
            A = allCharSet();
          } else {
            A = noLineTerminatorCharSet();
          }
          return CharacterSetMatcher(A, false, direction);
        }

        if (Atom.subtype === '\\') {
          return Evaluate_AtomEscape(Atom.AtomEscape, direction);
        }

        if (Atom.subtype === 'CharacterClass') {
          const { A, invert } = Evaluate_CharacterClass(Atom.CharacterClass);
          return CharacterSetMatcher(A, invert, direction);
        }

        if (Atom.subtype === '(') {
          const m = Evaluate_Disjunction(Atom.Disjunction);
          // TODO: Let parenIndex be the number of left-capturing parentheses in the entire regular expression that occur to the left of this Atom. This is the total number of Atom::(GroupSpecifierDisjunction) Parse Nodes prior to or enclosing this Atom.
          const parenIndex = 0;
          return (x, c) => {
            const d = (y) => {
              const cap = [...y.captures];
              const xe = x.endIndex;
              const ye = y.endIndex;
              let s;
              if (direction === 1) {
                Assert(xe <= ye);
                s = Input.slice(xe, ye);
              } else {
                Assert(direction === -1);
                Assert(ye <= xe);
                s = Input.slice(ye, xe);
              }
              cap[parenIndex + 1] = s;
              const z = new State(ye, cap);
              return c(z);
            };
            return m(x, d);
          };
        }

        if (Atom.subtype === '(?:') {
          return Evaluate_Disjunction(Atom.Disjunction, direction);
        }
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
            if (!A(cc)) {
              return MatchResultFailure;
            }
          } else {
            Assert(invert === true);
            if (A(cc)) {
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

      // 21.2.2.8.3 #sec-runtime-semantics-unicodematchproperty-p
      // function UnicodeMatchProperty(/* p */) {
      //   // TODO
      //   return [];
      // }

      // 21.2.2.8.4 #sec-runtime-semantics-unicodematchpropertyvalue-p-v
      // function UnicodeMatchPropertyValue(/* p, v */) {
      //   // TODO
      //   return [];
      // }

      // 21.2.2.9 #sec-atomescape
      function Evaluate_AtomEscape(AtomEscape, direction) {
        if (AtomEscape.subtype === 'DecimalEscape') {
          const n = Evaluate_DecimalEscape(AtomEscape.DecimalEscape);
          Assert(n <= NcapturingParens);
          return BackreferenceMatcher(n, direction);
        }

        if (AtomEscape.subtype === 'CharacterEscape') {
          const ch = Evaluate_CharacterEscape(AtomEscape.CharacterEscape);
          const A = singleCharSet(ch);
          return CharacterSetMatcher(A, false, direction);
        }

        if (AtomEscape.subtype === 'CharacterClassEscape') {
          const A = Evaluate_CharacterClassEscape(AtomEscape.CharacterClassEscape);
          return CharacterSetMatcher(A, false, direction);
        }

        if (AtomEscape.subtype === 'k') {
          // TODO
          // Search the enclosing Pattern for an instance of a GroupSpecifier for a RegExpIdentifierName which has a StringValue equal to the StringValue of the RegExpIdentifierName contained in GroupName.
          // Assert: A unique such GroupSpecifier is found.
          // Let parenIndex be the number of left-capturing parentheses in the entire regular expression that occur to the left of the located GroupSpecifier. This is the total number of Atom::(GroupSpecifierDisjunction) Parse Nodes prior to or enclosing the located GroupSpecifier.
          const parenIndex = 0;
          return BackreferenceMatcher(parenIndex, direction);
        }
      }

      // 21.2.2.9.1 #sec-backreference-matcher
      function BackreferenceMatcher(n, direction) {
        return (x, c) => {
          const cap = x.captures;
          const s = cap[n];
          if (s === Value.undefined) {
            return c(x);
          }
          const e = x.endIndex;
          const len = s.length;
          const f = e + direction * len;
          if (f < 0 || f > InputLength) {
            return MatchResultFailure;
          }
          // const g = Math.min(e, f);
          // TODO: If there exists an integer i between 0 (inclusive) and len (exclusive) such that Canonicalize(s[i]) is not the same character value as Canonicalize(Input[g + i]), return failure.
          const y = new State(f, cap);
          return c(y);
        };
      }

      // 21.2.2.10 #sec-characterescape
      function Evaluate_CharacterEscape(CharacterEscape) {
        const cv = CharacterEscape.CharacterValue;
        return String.fromCharCode(cv);
      }

      // 21.2.2.11 #sec-decimalescape
      function Evaluate_DecimalEscape(DecimalEscape) {
        return DecimalEscape.CapturingGroupNumber;
      }

      // 21.2.2.12 #sec-characterclassescape
      function Evaluate_CharacterClassEscape(CharacterClassEscape) {
        if (CharacterClassEscape.subtype === 'd') {
          return numberCharSet();
        }

        if (CharacterClassEscape.subtype === 'D') {
          return invertCharSet(numberCharSet());
        }

        if (CharacterClassEscape.subtype === 's') {
          return whitespaceCharSet();
        }

        if (CharacterClassEscape.subtype === 'S') {
          return invertCharSet(whitespaceCharSet());
        }

        if (CharacterClassEscape.subtype === 'w') {
          return WordCharacters();
        }

        if (CharacterClassEscape.subtype === 'W') {
          return invertCharSet(WordCharacters());
        }

        if (CharacterClassEscape.subtype === 'p{') {
          return Evaluate_UnicodePropertyValueExpression(CharacterClassEscape.UnicodePropertyValueExpression);
        }

        if (CharacterClassEscape.subtype === 'P{') {
          return invertCharSet(Evaluate_UnicodePropertyValueExpression(CharacterClassEscape.UnicodePropertyValueExpression));
        }
      }

      function Evaluate_UnicodePropertyValueExpression(/* UnicodePropertyValueExpression */) {
        // TODO
        // if (UnicodePropertyValueExpression.subtype === 'UnicodePropertyName_UnicodePropertyValueValue') {
        // const ps = UnicodePropertyValueExpression.UnicodePropertyName.SourceText;
        // const p = UnicodeMatchProperty(ps);
        // const vs = UnicodePropertyValueExpression.UnicodePropertyValue.SourceText;
        // const v = UnicodeMatchPropertyValue(p, vs);
        //   return null;
        // }
      }

      // 21.2.2.13 #sec-characterclass
      function Evaluate_CharacterClass(CharacterClass) {
        if (!CharacterClass.invert) {
          const A = Evaluate_ClassRanges(CharacterClass.ClassRanges);
          return { A, invert: false };
        } else {
          const A = Evaluate_ClassRanges(CharacterClass.ClassRanges);
          return { A, invert: true };
        }
      }

      // 21.2.2.14 #sec-classranges
      function Evaluate_ClassRanges(ClassRanges) {
        const ranges = ClassRanges.ClassRanges;
        if (ranges.length === 0) {
          return emptyCharSet();
        }
        const charSets = ranges.map((range) => {
          if (Array.isArray(range)) {
            const classAtom1 = getClassAtom(range[0]);
            const classAtom2 = getClassAtom(range[1]);
            return CharacterRange(classAtom1, classAtom2);
          } else {
            return classRangeAtomCharSet(range);
          }
        });

        return combinedCharSet(charSets);
      }

      // 21.2.2.15.1 #sec-runtime-semantics-characterrange-abstract-operation
      function CharacterRange(A, B) {
        return (cc) => cc >= A && cc <= B;
      }

      function singleCharSet(char) {
        return (cc) => Canonicalize(char) === cc;
      }

      function allCharSet() {
        return () => true;
      }

      function noLineTerminatorCharSet() {
        return (cc) => !isLineTerminator(cc);
      }

      function numberCharSet() {
        return (cc) => /0-9/.test(cc);
      }

      function whitespaceCharSet() {
        return (cc) => isStrWhiteSpaceChar(cc);
      }

      function emptyCharSet() {
        return () => false;
      }

      function invertCharSet(charSet) {
        return (cc) => !charSet(cc);
      }

      function combinedCharSet(charSets) {
        return (cc) => charSets.some((charSet) => charSet(cc));
      }

      function classRangeAtomCharSet(classRange) {
        const classAtom = getClassAtom(classRange);
        return (cc) => cc === classAtom;
      }

      function getClassAtom(ClassAtom) {
        if (ClassAtom.type === 'ClassAtom') {
          if (ClassAtom.subtype === '-') {
            return '-';
          }
          if (ClassAtom.subtype === 'ClassAtomNoDash') {
            return getClassAtom(ClassAtom.ClassAtomNoDash);
          }
        }
        if (ClassAtom.type === 'ClassAtomNoDash') {
          if (ClassAtom.subtype === 'SourceCharacter') {
            return ClassAtom.SourceCharacter;
          }
        }
        throw new Error('unreachable');
      }
    };
  }
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
