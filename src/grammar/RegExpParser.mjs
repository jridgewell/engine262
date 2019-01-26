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

export function walk(rootNode, visitors) {
  function c(node) {
    const type = node.type;
    if (!visitor[type]) {
      throw new Error(`unimplemented visitor[${type}]`);
    }
    visitor[type](node, c);
    if (visitors[type]) {
      visitors[type](node);
    }
  }
  c(rootNode);
}

const ignore = () => {};

const visitor = {};

visitor.Pattern = (node, c) => {
  c(node.Disjunction);
};

visitor.Disjunction = (node, c) => {
  for (const alt of node.Alternatives) {
    c(alt);
  }
};

visitor.Alternative = (node, c) => {
  for (const term of node.Terms) {
    c(term);
  }
};

visitor.Term = (node, c) => {
  switch (node.subtype) {
    case 'Atom':
      c(node.Atom);
      break;
    case 'AtomQuantifier':
      c(node.Atom);
      c(node.Quantifier);
      break;
    default:
      throw new Error(`unhandled subtype Term:${node.subtype}`);
  }
};

visitor.Atom = (node, c) => {
  switch (node.subtype) {
    case 'AtomGroup':
      c(node.Disjunction);
      break;
    default:
      throw new Error(`unhandled subtype Atom:${node.subtype}`);
  }
};

visitor.CharacterClass = ignore;

visitor.Quantifier = (node, c) => {
  c(node.QuantifierPrefix);
};

visitor.QuantifierPrefix = ignore;
