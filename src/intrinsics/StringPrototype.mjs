import { surroundingAgent } from '../engine.mjs';
import {
  ArrayCreate,
  Assert,
  Call,
  CodePointAt,
  CreateDataProperty,
  GetMethod,
  Invoke,
  IsCallable,
  IsRegExp,
  RegExpCreate,
  RequireObjectCoercible,
  ToInteger,
  ToNumber,
  ToString,
  ToUint32,
  StringCreate,
} from '../abstract-ops/all.mjs';
import {
  Type,
  Value,
  wellKnownSymbols,
} from '../value.mjs';
import { GetSubstitution, TrimString, StringPad } from '../runtime-semantics/all.mjs';
import { Q, X } from '../completion.mjs';
import { CreateStringIterator } from './StringIteratorPrototype.mjs';
import { assignProps } from './Bootstrap.mjs';


function thisStringValue(value) {
  if (Type(value) === 'String') {
    return value;
  }
  if (Type(value) === 'Object' && 'StringData' in value) {
    const s = value.StringData;
    Assert(Type(s) === 'String');
    return s;
  }
  return surroundingAgent.Throw('TypeError', 'NotATypeObject', 'String', value);
}

// 21.1.3.1 #sec-string.prototype.charat
function StringProto_charAt([pos = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const position = Q(ToInteger(pos)).numberValue();
  const size = S.stringValue().length;
  if (position < 0 || position >= size) {
    return new Value('');
  }
  return new Value(S.stringValue()[position]);
}

// 21.1.3.2 #sec-string.prototype.charcodeat
function StringProto_charCodeAt([pos = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const position = Q(ToInteger(pos)).numberValue();
  const size = S.stringValue().length;
  if (position < 0 || position >= size) {
    return new Value(NaN);
  }
  return new Value(S.stringValue().charCodeAt(position));
}

// 21.1.3.3 #sec-string.prototype.codepointat
function StringProto_codePointAt([pos = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const position = Q(ToInteger(pos)).numberValue();
  const size = S.stringValue().length;
  if (position < 0 || position >= size) {
    return Value.undefined;
  }
  const cp = X(CodePointAt(S, position));
  return cp.CodePoint;
}

// 21.1.3.4 #sec-string.prototype.concat
function StringProto_concat(args, { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  let R = S.stringValue();
  while (args.length > 0) {
    const next = args.shift();
    const nextString = Q(ToString(next));
    R = `${R}${nextString.stringValue()}`;
  }
  return new Value(R);
}

// 21.1.3.6 #sec-string.prototype.endswith
function StringProto_endsWith([searchString = Value.undefined, endPosition = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const isRegExp = Q(IsRegExp(searchString));
  if (isRegExp === Value.true) {
    return surroundingAgent.Throw('TypeError', 'RegExpArgumentNotAllowed', 'String.prototype.endsWith');
  }
  const searchStr = Q(ToString(searchString)).stringValue();
  const len = S.length;
  let pos;
  if (endPosition === Value.undefined) {
    pos = len;
  } else {
    pos = Q(ToInteger(endPosition)).numberValue();
  }
  const end = Math.min(Math.max(pos, 0), len);
  const searchLength = searchStr.length;
  const start = end - searchLength;
  if (start < 0) {
    return Value.false;
  }
  for (let i = 0; i < searchLength; i += 1) {
    if (S.charCodeAt(start + i) !== searchStr.charCodeAt(i)) {
      return Value.false;
    }
  }
  return Value.true;
}

// 21.1.3.7 #sec-string.prototype.includes
function StringProto_includes([searchString = Value.undefined, position = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const isRegExp = Q(IsRegExp(searchString));
  if (isRegExp === Value.true) {
    return surroundingAgent.Throw('TypeError', 'RegExpArgumentNotAllowed', 'String.prototype.includes');
  }
  const searchStr = Q(ToString(searchString)).stringValue();
  const pos = Q(ToInteger(position));
  Assert(!(position === Value.undefined) || pos.numberValue() === 0);
  const len = S.length;
  const start = Math.min(Math.max(pos.numberValue(), 0), len);
  const searchLen = searchStr.length;
  let k = start;
  while (k + searchLen <= len) {
    let match = true;
    for (let j = 0; j < searchLen; j += 1) {
      if (searchStr[j] !== S[k + j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return Value.true;
    }
    k += 1;
  }
  return Value.false;
}

// 21.1.3.8 #sec-string.prototype.indexof
function StringProto_indexOf([searchString = Value.undefined, position = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const searchStr = Q(ToString(searchString)).stringValue();
  const pos = Q(ToInteger(position));
  Assert(!(position === Value.undefined) || pos.numberValue() === 0);
  const len = S.length;
  const start = Math.min(Math.max(pos.numberValue(), 0), len);
  const searchLen = searchStr.length;
  let k = start;
  while (k + searchLen <= len) {
    let match = true;
    for (let j = 0; j < searchLen; j += 1) {
      if (searchStr[j] !== S[k + j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return new Value(k);
    }
    k += 1;
  }
  return new Value(-1);
}

// 21.1.3.9 #sec-string.prototype.lastindexof
function StringProto_lastIndexOf([searchString = Value.undefined, position = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const searchStr = Q(ToString(searchString)).stringValue();
  const numPos = Q(ToNumber(position));
  Assert(!(position === Value.undefined) || numPos.isNaN());
  let pos;
  if (numPos.isNaN()) {
    pos = new Value(Infinity);
  } else {
    pos = X(ToInteger(numPos));
  }
  const len = S.length;
  const start = Math.min(Math.max(pos.numberValue(), 0), len);
  const searchLen = searchStr.length;
  let k = start;
  while (k >= 0) {
    if (k + searchLen <= len) {
      let match = true;
      for (let j = 0; j < searchLen; j += 1) {
        if (searchStr[j] !== S[k + j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return new Value(k);
      }
    }
    k -= 1;
  }
  return new Value(-1);
}

// 21.1.3.10 #sec-string.prototype.localecompare
function StringProto_localeCompare([that = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const That = Q(ToString(that)).stringValue();
  if (S === That) {
    return new Value(0);
  } else if (S < That) {
    return new Value(-1);
  } else {
    return new Value(1);
  }
}

// 21.1.3.11 #sec-string.prototype.match
function StringProto_match([regexp = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));

  if (regexp !== Value.undefined && regexp !== Value.null) {
    const matcher = Q(GetMethod(regexp, wellKnownSymbols.match));
    if (matcher !== Value.undefined) {
      return Q(Call(matcher, regexp, [O]));
    }
  }

  const S = Q(ToString(O));
  const rx = Q(RegExpCreate(regexp, Value.undefined));
  return Q(Invoke(rx, wellKnownSymbols.match, [S]));
}

// 21.1.3.12 #sec-string.prototype.matchall
function StringProto_matchAll([regexp = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  if (regexp !== Value.undefined && regexp !== Value.null) {
    const matcher = Q(GetMethod(regexp, wellKnownSymbols.matchAll));
    if (matcher !== Value.undefined) {
      return Q(Call(matcher, regexp, [O]));
    }
  }
  const S = Q(ToString(O));
  const rx = Q(RegExpCreate(regexp, new Value('g')));
  return Q(Invoke(rx, wellKnownSymbols.matchAll, [S]));
}

// 21.1.3.13 #sec-string.prototype.normalize
function StringProto_normalize([form = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  if (form === Value.undefined) {
    form = new Value('NFC');
  } else {
    form = Q(ToString(form));
  }
  const f = form.stringValue();
  if (!['NFC', 'NFD', 'NFKC', 'NFKD'].includes(f)) {
    return surroundingAgent.Throw('RangeError', 'NormalizeInvalidForm');
  }
  const ns = S.stringValue().normalize(f);
  return new Value(ns);
}

// 21.1.3.14 #sec-string.prototype.padend
function StringProto_padEnd([maxLength = Value.undefined, fillString = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  return Q(StringPad(O, maxLength, fillString, 'end'));
}

// 21.1.3.15 #sec-string.prototype.padstart
function StringProto_padStart([maxLength = Value.undefined, fillString = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  return Q(StringPad(O, maxLength, fillString, 'start'));
}

// 21.1.3.16 #sec-string.prototype.repeat
function StringProto_repeat([count = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const n = Q(ToInteger(count));
  if (n.numberValue() < 0) {
    return surroundingAgent.Throw('RangeError', 'StringRepeatCount', n);
  }
  if (n.isInfinity()) {
    return surroundingAgent.Throw('RangeError', 'StringRepeatCount', n);
  }
  if (n.numberValue() === 0) {
    return new Value('');
  }
  let T = '';
  for (let i = 0; i < n.numberValue(); i += 1) {
    T += S.stringValue();
  }
  return new Value(T);
}

// 21.1.3.17 #sec-string.prototype.replace
function StringProto_replace([searchValue = Value.undefined, replaceValue = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  if (searchValue !== Value.undefined && searchValue !== Value.null) {
    const replacer = Q(GetMethod(searchValue, wellKnownSymbols.replace));
    if (replacer !== Value.undefined) {
      return Q(Call(replacer, searchValue, [O, replaceValue]));
    }
  }
  const string = Q(ToString(O));
  const searchString = Q(ToString(searchValue));
  const functionalReplace = IsCallable(replaceValue);
  if (functionalReplace === Value.false) {
    replaceValue = Q(ToString(replaceValue));
  }
  const pos = new Value(string.stringValue().indexOf(searchString.stringValue()));
  const matched = searchString;
  if (pos.numberValue() === -1) {
    return string;
  }
  let replStr;
  if (functionalReplace === Value.true) {
    const replValue = Q(Call(replaceValue, Value.undefined, [matched, pos, string]));
    replStr = Q(ToString(replValue));
  } else {
    const captures = [];
    replStr = X(GetSubstitution(matched, string, pos, captures, Value.undefined, replaceValue));
  }
  const tailPos = pos.numberValue() + matched.stringValue().length;
  const newString = string.stringValue().slice(0, pos.numberValue()) + replStr.stringValue() + string.stringValue().slice(tailPos);
  return new Value(newString);
}

// 21.1.3.19 #sec-string.prototype.slice
function StringProto_search([regexp = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));

  if (regexp !== Value.undefined && regexp !== Value.null) {
    const searcher = Q(GetMethod(regexp, wellKnownSymbols.search));
    if (searcher !== Value.undefined) {
      return Q(Call(searcher, regexp, [O]));
    }
  }

  const string = Q(ToString(O));
  const rx = Q(RegExpCreate(regexp, Value.undefined));
  return Q(Invoke(rx, wellKnownSymbols.search, [string]));
}

// 21.1.3.19 #sec-string.prototype.slice
function StringProto_slice([start = Value.undefined, end = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const len = S.length;
  const intStart = Q(ToInteger(start)).numberValue();
  let intEnd;
  if (end === Value.undefined) {
    intEnd = len;
  } else {
    intEnd = Q(ToInteger(end)).numberValue();
  }
  let from;
  if (intStart < 0) {
    from = Math.max(len + intStart, 0);
  } else {
    from = Math.min(intStart, len);
  }
  let to;
  if (intEnd < 0) {
    to = Math.max(len + intEnd, 0);
  } else {
    to = Math.min(intEnd, len);
  }
  const span = Math.max(to - from, 0);
  return new Value(S.slice(from, from + span));
}

// 21.1.3.20 #sec-string.prototype.split
function StringProto_split([separator = Value.undefined, limit = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  if (separator !== Value.undefined && separator !== Value.null) {
    const splitter = Q(GetMethod(separator, wellKnownSymbols.split));
    if (splitter !== Value.undefined) {
      return Q(Call(splitter, separator, [O, limit]));
    }
  }
  const S = Q(ToString(O));
  const A = X(ArrayCreate(new Value(0)));
  let lengthA = 0;
  let lim;
  if (limit === Value.undefined) {
    lim = new Value((2 ** 32) - 1);
  } else {
    lim = Q(ToUint32(limit));
  }
  const s = S.stringValue().length;
  let p = 0;
  const R = Q(ToString(separator));
  if (lim.numberValue() === 0) {
    return A;
  }
  if (separator === Value.undefined) {
    X(CreateDataProperty(A, new Value('0'), S));
    return A;
  }
  if (s === 0) {
    const z = SplitMatch(S, 0, R);
    if (z !== false) {
      return A;
    }
    X(CreateDataProperty(A, new Value('0'), S));
    return A;
  }
  let q = p;
  while (q !== s) {
    const e = SplitMatch(S, q, R);
    if (e === false) {
      q += 1;
    } else {
      if (e === p) {
        q += 1;
      } else {
        const T = new Value(S.stringValue().substring(p, q));
        X(CreateDataProperty(A, X(ToString(new Value(lengthA))), T));
        lengthA += 1;
        if (lengthA === lim.numberValue()) {
          return A;
        }
        p = e;
        q = p;
      }
    }
  }
  const T = new Value(S.stringValue().substring(p, s));
  X(CreateDataProperty(A, X(ToString(new Value(lengthA))), T));
  return A;
}

// 21.1.3.20.1 #sec-splitmatch
function SplitMatch(S, q, R) {
  Assert(Type(R) === 'String');
  const r = R.stringValue().length;
  const s = S.stringValue().length;
  if (q + r > s) {
    return false;
  }
  for (let i = 0; i < r; i += 1) {
    if (S.stringValue().charCodeAt(q + i) !== R.stringValue().charCodeAt(i)) {
      return false;
    }
  }
  return q + r;
}

// 21.1.3.21 #sec-string.prototype.startswith
function StringProto_startsWith([searchString = Value.undefined, position = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const isRegExp = Q(IsRegExp(searchString));
  if (isRegExp === Value.true) {
    return surroundingAgent.Throw('TypeError', 'RegExpArgumentNotAllowed', 'String.prototype.startsWith');
  }
  const searchStr = Q(ToString(searchString)).stringValue();
  const pos = Q(ToInteger(position)).numberValue();
  Assert(!(position === Value.undefined) || pos === 0);
  const len = S.length;
  const start = Math.min(Math.max(pos, 0), len);
  const searchLength = searchStr.length;
  if (searchLength + start > len) {
    return Value.false;
  }
  for (let i = 0; i < searchLength; i += 1) {
    if (S.charCodeAt(start + i) !== searchStr.charCodeAt(i)) {
      return Value.false;
    }
  }
  return Value.true;
}

// 21.1.3.22 #sec-string.prototype.substring
function StringProto_substring([start = Value.undefined, end = Value.undefined], { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O)).stringValue();
  const len = S.length;
  const intStart = Q(ToInteger(start)).numberValue();
  let intEnd;
  if (end === Value.undefined) {
    intEnd = len;
  } else {
    intEnd = Q(ToInteger(end)).numberValue();
  }
  const finalStart = Math.min(Math.max(intStart, 0), len);
  const finalEnd = Math.min(Math.max(intEnd, 0), len);
  const from = Math.min(finalStart, finalEnd);
  const to = Math.max(finalStart, finalEnd);
  return new Value(S.slice(from, to));
}

// 21.1.3.23 #sec-string.prototype.tolocalelowercase
function StringProto_toLocaleLowerCase(args, { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const L = S.stringValue().toLocaleLowerCase();
  return new Value(L);
}

// 21.1.3.24 #sec-string.prototype.tolocaleuppercase
function StringProto_toLocaleUpperCase(args, { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const L = S.stringValue().toLocaleUpperCase();
  return new Value(L);
}

// 21.1.3.25 #sec-string.prototype.tolowercase
function StringProto_toLowerCase(args, { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const L = S.stringValue().toLowerCase();
  return new Value(L);
}

// 21.1.3.26 #sec-string.prototype.tostring
function StringProto_toString(args, { thisValue }) {
  return Q(thisStringValue(thisValue));
}

// 21.1.3.27 #sec-string.prototype.touppercase
function StringProto_toUpperCase(args, { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  const L = S.stringValue().toUpperCase();
  return new Value(L);
}

// 21.1.3.28 #sec-string.prototype.trim
function StringProto_trim(args, { thisValue }) {
  const S = thisValue;
  return Q(TrimString(S, 'start+end'));
}

// 21.1.3.29 #sec-string.prototype.trimend
function StringProto_trimEnd(args, { thisValue }) {
  const S = thisValue;
  return Q(TrimString(S, 'end'));
}

// 21.1.3.30 #sec-string.prototype.trimstart
function StringProto_trimStart(args, { thisValue }) {
  const S = thisValue;
  return Q(TrimString(S, 'start'));
}

// 21.1.3.31 #sec-string.prototype.valueof
function StringProto_valueOf(args, { thisValue }) {
  return Q(thisStringValue(thisValue));
}

// 21.1.3.32 #sec-string.prototype-@@iterator
function StringProto_iterator(args, { thisValue }) {
  const O = Q(RequireObjectCoercible(thisValue));
  const S = Q(ToString(O));
  return Q(CreateStringIterator(S));
}

export function BootstrapStringPrototype(realmRec) {
  const proto = StringCreate(new Value(''), realmRec.Intrinsics['%Object.prototype%']);

  assignProps(realmRec, proto, [
    ['charAt', StringProto_charAt, 1],
    ['charCodeAt', StringProto_charCodeAt, 1],
    ['codePointAt', StringProto_codePointAt, 1],
    ['concat', StringProto_concat, 1],
    ['endsWith', StringProto_endsWith, 1],
    ['includes', StringProto_includes, 1],
    ['indexOf', StringProto_indexOf, 1],
    ['lastIndexOf', StringProto_lastIndexOf, 1],
    ['localeCompare', StringProto_localeCompare, 1],
    ['match', StringProto_match, 1],
    ['matchAll', StringProto_matchAll, 1],
    ['normalize', StringProto_normalize, 0],
    ['padEnd', StringProto_padEnd, 1],
    ['padStart', StringProto_padStart, 1],
    ['repeat', StringProto_repeat, 1],
    ['replace', StringProto_replace, 2],
    ['search', StringProto_search, 1],
    ['slice', StringProto_slice, 2],
    ['split', StringProto_split, 2],
    ['startsWith', StringProto_startsWith, 1],
    ['substring', StringProto_substring, 2],
    ['toLocaleLowerCase', StringProto_toLocaleLowerCase, 0],
    ['toLocaleUpperCase', StringProto_toLocaleUpperCase, 0],
    ['toLowerCase', StringProto_toLowerCase, 0],
    ['toString', StringProto_toString, 0],
    ['toUpperCase', StringProto_toUpperCase, 0],
    ['trim', StringProto_trim, 0],
    ['trimEnd', StringProto_trimEnd, 0],
    ['trimStart', StringProto_trimStart, 0],
    ['valueOf', StringProto_valueOf, 0],
    [wellKnownSymbols.iterator, StringProto_iterator, 0],
  ]);

  realmRec.Intrinsics['%String.prototype%'] = proto;
}
