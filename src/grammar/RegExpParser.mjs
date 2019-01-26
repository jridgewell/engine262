import nearley from 'nearley';
import { registerTokens } from './lookaheads.mjs';
import RegExpGrammar from './RegExp-gen.mjs';

const { ParserRules } = RegExpGrammar;

const Pattern_Grammar = nearley.Grammar.fromCompiled({
  ParserRules,
  ParserStart: 'Pattern',
});

const Pattern_N_Grammar = nearley.Grammar.fromCompiled({
  ParserRules,
  ParserStart: 'Pattern_N',
});

const Pattern_U_Grammar = nearley.Grammar.fromCompiled({
  ParserRules,
  ParserStart: 'Pattern_U',
});

const Pattern_U_N_Grammar = nearley.Grammar.fromCompiled({
  ParserRules,
  ParserStart: 'Pattern_U_N',
});

export function parseRegExp(tokens, options) {
  const { U, N } = options;
  let grammar;
  if (U && N) {
    grammar = Pattern_U_N_Grammar;
  } else if (U) {
    grammar = Pattern_U_Grammar;
  } else if (N) {
    grammar = Pattern_N_Grammar;
  } else {
    grammar = Pattern_Grammar;
  }
  const parser = new nearley.Parser(grammar);
  registerTokens('RegExp', tokens);
  parser.feed(tokens);

  const results = parser.results;

  if (results.length > 1) {
    throw new Error('ambiguity');
  }
  return results[0];
}
