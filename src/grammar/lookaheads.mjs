const lookaheadMap = new Map();

export function registerTokens(parser, tokens) {
  lookaheadMap.set(parser, tokens);
}

export function lookahead(parser, start, length) {
  return lookaheadMap.get(parser).slice(start, start + length);
}
