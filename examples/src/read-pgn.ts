import { createReadStream } from 'fs';
import { parseSan } from 'chessops/san';
import { makeFen } from 'chessops/fen';
import { PgnParser, walk, startingPosition } from 'chessops/pgn';

const status = {
  games: 0,
  errors: 0,
  moves: 0,
  skipped: 0,
};

for (const arg of process.argv.slice(2)) {
  console.log('#', arg);

  const stream = createReadStream(arg, { encoding: 'utf-8' });

  const parser = new PgnParser((game, err) => {
    status.games++;

    if (err) {
      console.error(err);
      status.errors++;
      stream.destroy(err);
    }

    if (game.headers.get('FEN') === '?') status.skipped++;
    else
      startingPosition(game.headers).unwrap(
        pos =>
          walk(game.moves, pos, (pos, node) => {
            const move = parseSan(pos, node.san);
            if (!move) {
              console.error(node, game.headers, makeFen(pos.toSetup()));
              status.errors++;
              return false;
            } else {
              pos.play(move);
              status.moves++;
            }
            return true;
          }),
        err => {
          console.error(err, game.headers);
          status.errors++;
        }
      );

    if (status.games % 1024 == 0) console.log(status);
  });

  await new Promise<void>(resolve =>
    stream
      .on('data', (chunk: string) => parser.parse(chunk, { stream: true }))
      .on('close', () => {
        parser.parse('');
        console.log(status);
        resolve();
      })
  );
}
