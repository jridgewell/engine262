import nearley from 'nearley';
import grammar from './src/grammar/RegExp-gen.mjs';
import { registerTokens } from './src/grammar/lookaheads.mjs';
import util from 'util';

util.inspect.defaultOptions.depth = Infinity;

{
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  registerTokens('RegExp', [...process.argv[2]]);
  parser.feed([...process.argv[2]]);
  console.log(parser.results);
}
