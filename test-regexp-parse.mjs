import util from 'util';
import { parse, walk } from './src/grammar/RegExpParser';

util.inspect.defaultOptions.depth = Infinity;

{
  const result = parse([...process.argv[2]], { U: true, N: true });
  console.log(result);

  const capturingGroups = [];
  walk(result.pattern, {
    Atom: (node) => {
      if (node.subtype === '(') {
        capturingGroups.push(node.GroupSpecifier && node.GroupSpecifier.GroupName);
      }
    },
  });
  console.log('capturing groups: ', capturingGroups);
}
