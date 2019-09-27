import { Square, Color, Role, Piece, COLORS, ROLES } from './types';
import { SquareSet } from './squareSet';

export class Board {
  private occupied: SquareSet;

  private promoted: SquareSet;

  private white: SquareSet;
  private black: SquareSet;

  private pawn: SquareSet;
  private knight: SquareSet;
  private bishop: SquareSet;
  private rook: SquareSet;
  private queen: SquareSet;
  private king: SquareSet;

  static default(): Board {
    const board = new Board();
    board.occupied = new SquareSet(0xffff, 0xffff0000);
    board.white = new SquareSet(0xffff, 0);
    board.black = new SquareSet(0, 0xffff0000);
    board.pawn = new SquareSet(0xff00, 0xff0000);
    board.knight = new SquareSet(0x42, 0x42000000);
    board.bishop = new SquareSet(0x24, 0x24000000);
    board.rook = new SquareSet(0x81, 0x81000000);
    board.queen = new SquareSet(0x8, 0x8000000);
    board.king = new SquareSet(0x10, 0x10000000);
    return board;
  }

  clear() {
    this.occupied = SquareSet.empty();
    this.promoted = SquareSet.empty();
    for (const color of COLORS) this[color] = SquareSet.empty();
    for (const role of ROLES) this[role] = SquareSet.empty();
  }

  constructor() {
    this.clear();
  }

  private getColor(square: Square): Color | undefined {
    if (this.white.has(square)) return 'white';
    else if (this.black.has(square)) return 'black';
    else return;
  }

  get(square: Square): Piece | undefined {
    const color = this.getColor(square);
    if (!color) return;
    const promoted = this.promoted.has(square);
    for (const role of ROLES) {
      if (this[role].has(square)) return { color, promoted, role };
    }
    return;
  }

  take(square: Square): Piece | undefined {
    const piece = this.get(square);
    if (piece) {
      this.occupied = this.occupied.without(square);
      this[piece.color] = this[piece.color].without(square);
      this[piece.role] = this[piece.role].without(square);
      if (piece.promoted) this.promoted = this.promoted.without(square);
    }
    return piece;
  }

  delete(square: Square): boolean {
    return !!this.take(square);
  }

  set(square: Square, piece: Piece): Piece | undefined {
    const old = this.take(square);
    this.occupied = this.occupied.with(square);
    this[piece.color] = this[piece.color].with(square);
    this[piece.role] = this[piece.role].with(square);
    if (piece.promoted) this.promoted = this.promoted.with(square);
    return old;
  }

  has(square: Square): boolean {
    return this.occupied.has(square);
  }

  keys(): Iterator<Square> {
    return this.occupied[Symbol.iterator]();
  }

  entries(): Iterator<[Square, Piece]> {
    const self = this;
    const keys = this.keys();
    return {
      next(): IteratorResult<[Square, Piece]> {
        const entry = keys.next();
        if (entry.done) return { done: true } as IteratorResult<[Square, Piece]>;
        else return { value: [entry.value, self.get(entry.value)!], done: false };
      }
    };
  }

  [Symbol.iterator](): Iterator<[Square, Piece]> {
    return this.entries();
  }
}