import util from 'util';
import { parseRegExp, walk } from './src/grammar/RegExpParser';

util.inspect.defaultOptions.depth = Infinity;

{
  const result = parseRegExp([...process.argv[2]], { U: true, N: true });
  console.log(result);

  const capturingGroups = [];
  walk(result, {
    Atom: (node) => {
      if (node.subtype === 'AtomGroup' && node.capturing) {
        capturingGroups.push(node.name);
      }
    },
  });
  console.log('capturing groups: ', capturingGroups);
}
