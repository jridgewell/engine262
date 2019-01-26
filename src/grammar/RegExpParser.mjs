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

export function parse(string, options) {
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
  const tokens = [...string];
  registerTokens('RegExp', tokens);
  parser.feed(tokens);

  const results = parser.results;

  if (results.length < 0) {
    throw new Error('Invalid RegExp');
  }
  if (results.length > 1) {
    throw new Error('ambiguity');
  }

  const pattern = results[0];

  let nCapturingParens = 0;
  const groupSpecifierNames = new Set();
  walk(pattern, {
    Atom(node) {
      if (node.subtype === '(') {
        nCapturingParens += 1;
      }
    },
    GroupSpecifier(node) {
      // It is a Syntax Error if Pattern contains multiple GroupSpecifiers whose enclosed RegExpIdentifierNames have the same StringValue.
      const { GroupName } = node;
      if (groupSpecifierNames.has(GroupName)) {
        throw new SyntaxError(`duplicate capture group name: ${GroupName}`);
      }
      groupSpecifierNames.add(GroupName);
    },
  });

  if (nCapturingParens >= (2 ** 32) - 1) {
    // It is a Syntax Error if NcapturingParens ≥ 232 - 1.
    throw new SyntaxError('a RegExp may not contain more than 2^32-1 capturing parentheses');
  }

  return {
    pattern,
    nCapturingParens,
    groupSpecifierNames,
  };
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
  if (node.subtype === 'Alternative') {
    c(node.Alternative);
  } else {
    c(node.Alternative);
    c(node.Disjunction);
  }
};

visitor.Alternative = (node, c) => {
  if (node.Alternative) {
    c(node.Alternative);
    c(node.Term);
  }
};

visitor.Term = (node, c) => {
  switch (node.subtype) {
    case 'Assertion':
      c(node.Assertion);
      break;
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

visitor.Quantifier = (node, c) => {
  c(node.QuantifierPrefix);
};

visitor.QuantifierPrefix = ignore;

visitor.Atom = (node, c) => {
  switch (node.subtype) {
    case 'PatternCharacter':
      break;
    case '.':
      break;
    case '\\':
      c(node.AtomEscape);
      break;
    case 'CharacterClass':
      c(node.CharacterClass);
      break;
    case '(':
      if (node.GroupSpecifier) {
        c(node.GroupSpecifier);
      }
      c(node.Disjunction);
      break;
    case '(?:':
      c(node.Disjunction);
      break;
    default:
      throw new Error(`unhandled subtype Atom:${node.subtype}`);
  }
};

visitor.GroupSpecifier = ignore;

visitor.CharacterClass = (node, c) => {
  if (node.ClassRanges) {
    c(node.ClassRanges);
  }
};

visitor.ClassRanges = ignore; // TODO
