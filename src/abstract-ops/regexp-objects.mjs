import {
  surroundingAgent,
} from '../engine.mjs';
import {
  Descriptor,
  Value,
} from '../value.mjs';
import {
  DefinePropertyOrThrow,
  OrdinaryCreateFromConstructor,
  Set,
  ToString,
} from './all.mjs';
import {
  getMatcher,
} from '../runtime-semantics/all.mjs';
import { Q, X } from '../completion.mjs';
import { msg } from '../helpers.mjs';
import { parseRegExp } from '../grammar/RegExpParser.mjs';

// 21.2.3.2.1 #sec-regexpalloc
export function RegExpAlloc(newTarget) {
  const obj = Q(OrdinaryCreateFromConstructor(newTarget, '%RegExpPrototype%', ['RegExpMatcher', 'OriginalSource', 'OriginalFlags']));
  X(DefinePropertyOrThrow(obj, new Value('lastIndex'), Descriptor({
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.false,
  })));
  return obj;
}

// 21.2.3.2.2 #sec-regexpinitialize
export function RegExpInitialize(obj, pattern, flags) {
  let P;
  if (pattern === Value.undefined) {
    P = new Value('');
  } else {
    P = Q(ToString(pattern));
  }

  let F;
  if (flags === Value.undefined) {
    F = new Value('');
  } else {
    F = Q(ToString(flags));
  }

  const f = F.stringValue();
  if (/^[gimsuy]*$/.test(f) === false || (new global.Set(f).size !== f.length)) {
    return surroundingAgent.Throw('SyntaxError', msg('InvalidRegExpFlags', f));
  }

  const BMP = !f.includes('u');

  let parsed;
  let patternCharacters;
  try {
    if (BMP) {
      patternCharacters = P.stringValue().split('');
      parsed = parseRegExp(patternCharacters, { U: false, N: false });
      if (parsed.groupSpecifierNames.size > 0) {
        parsed = parseRegExp(patternCharacters, { U: false, N: true });
      }
    } else {
      patternCharacters = Array.from(P.stringValue());
      parsed = parseRegExp(patternCharacters, { U: true, N: true });
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      return surroundingAgent.Throw('SyntaxError', e.message);
    }
    throw e;
  }

  obj.OriginalSource = P;
  obj.OriginalFlags = F;
  obj.RegExpMatcher = getMatcher(parsed, patternCharacters, F.stringValue());

  Q(Set(obj, new Value('lastIndex'), new Value(0), Value.true));
  return obj;
}

// 21.2.3.2.3 #sec-regexpcreate
export function RegExpCreate(P, F) {
  const obj = Q(RegExpAlloc(surroundingAgent.intrinsic('%RegExp%')));
  return Q(RegExpInitialize(obj, P, F));
}

// 21.2.3.2.4 #sec-escaperegexppattern
export function EscapeRegExpPattern(P, F) {
  // TODO: implement this without host
  const re = new RegExp(P.stringValue(), F.stringValue());
  return new Value(re.source);
}
