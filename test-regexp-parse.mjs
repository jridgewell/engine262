import util from 'util';
import { parse, walk } from './src/grammar/RegExpParser';

util.inspect.defaultOptions.depth = Infinity;

{
  const result = parse([...process.argv[2]], { U: true, N: true });
  console.log(result);

  const capturingGroups = [];
  walk(result.pattern, {
    Atom: (node) => {
      if (node.subtype === 'AtomGroup' && node.capturing) {
        capturingGroups.push(node.name);
      }
    },
  });
  console.log('capturing groups: ', capturingGroups);
}
