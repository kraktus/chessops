import { makePgn, Node, ChildNode, PgnNodeData, PgnParser, Game, parsePgn } from './pgn.js';
import { jest } from '@jest/globals';

test('make pgn', () => {
  const root = new Node<PgnNodeData>();

  const e4 = new ChildNode<PgnNodeData>({
    san: 'e4',
    nags: [7],
  });
  const e3 = new ChildNode<PgnNodeData>({ san: 'e3' });
  root.children.push(e4);
  root.children.push(e3);

  const e5 = new ChildNode<PgnNodeData>({
    san: 'e5',
  });
  const e6 = new ChildNode<PgnNodeData>({ san: 'e6' });
  e4.children.push(e5);
  e4.children.push(e6);

  const nf3 = new ChildNode<PgnNodeData>({
    san: 'Nf3',
    comments: ['a comment'],
  });
  e6.children.push(nf3);

  const c4 = new ChildNode<PgnNodeData>({ san: 'c4' });
  e5.children.push(c4);

  expect(makePgn({ headers: new Map(), moves: root })).toEqual(
    '1. e4 $7 ( 1. e3 ) 1... e5 ( 1... e6 2. Nf3 { a comment } ) 2. c4 *'
  );
});

test('parse headers', () => {
  const games = parsePgn(
    [
      '[Black "black player"]',
      '[White "white player"]',
      '[Escaped "quote: \\", backslashes: \\\\\\\\, trailing text"]',
    ].join('\r\n')
  );
  expect(games).toHaveLength(1);
  expect(games[0].headers.get('Black')).toBe('black player');
  expect(games[0].headers.get('White')).toBe('white player');
  expect(games[0].headers.get('Escaped')).toBe('quote: ", backslashes: \\\\, trailing text');
  expect(games[0].headers.get('Result')).toBe('*');
  expect(games[0].headers.get('Event')).toBe('?');
});

test('parse pgn', () => {
  const callback = jest.fn((game: Game<PgnNodeData>) => {
    expect(makePgn(game)).toBe('[Result "1-0"]\n\n1. e4 e5 2. Nf3 { foo } 1-0');
  });
  const parser = new PgnParser(callback, () => new Map());
  parser.parse('1. e4 \ne5', { stream: true });
  parser.parse('\nNf3 {f', { stream: true });
  parser.parse('oo } 1-', { stream: true });
  parser.parse('', { stream: true });
  parser.parse('0', { stream: true });
  parser.parse('');
  expect(callback).toHaveBeenCalledTimes(1);
});