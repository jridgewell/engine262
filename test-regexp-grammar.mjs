import util from 'util';
import nearley from 'nearley';
import grammar from './src/grammar/RegExp-gen.mjs';
import { registerTokens } from './src/grammar/lookaheads.mjs';

util.inspect.defaultOptions.depth = Infinity;

{
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled({ ...grammar, ParserStart: 'Pattern_U' }));
  registerTokens('RegExp', [...process.argv[2]]);
  parser.feed([...process.argv[2]]);
  console.log(parser.results);
}
