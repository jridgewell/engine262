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
    const m = Evaluate_Disjunction(Pattern.Disjunction, 1);
    return (str, index) => {
      Assert(index <= str.length);
      const Input = Unicode ? Array.from(str) : str.split('');
      const InputLength = Input.length;
      // TODO: Let listIndex be the index into Input of the character that was obtained from element index of str.
      const listIndex = index;
      const c = (state) => state;
      const cap = new Array(NcapturingParens).fill(Value.undefined);
      const x = new State(listIndex, cap);
      return m(x, c);
    };
  }

  return Evaluate_Pattern(pattern);

  // 21.2.2.3 #sec-disjunction
  function Evaluate_Disjunction(Disjunction, direction) {
    if (Disjunction.subtype === 'Alternative') {
      const m = Evaluate_Alternative(Disjunction.Alternative);
      return m;
    } else {
      const m1 = Evaluate_Alternative(Disjunction.Alternative, direction);
      const m2 = Evaluate_Alternative(Disjunction.Disjunction, direction);
      return (x, c) => {
        const r = m1(x, c);
        if (r !== MatchResultFailure) {
          return r;
        }
        return m2(x, c);
      };
    }
  }

  // 21.2.2.4 #sec-alternative
  function Evaluate_Alternative(Alternative, direction) {
    // TODO
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
