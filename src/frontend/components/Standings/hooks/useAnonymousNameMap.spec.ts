import { describe, it, expect } from 'vitest';
import { assignAnonymousNames } from './useAnonymousNameMap';

const d = (CarIdx: number, UserID: number, CarIsPaceCar = 0) => ({
  CarIdx,
  UserID,
  CarIsPaceCar,
});
const names = ['A', 'B', 'C'];

describe('assignAnonymousNames', () => {
  it('is stable across sessions and skips the pace car', () => {
    const a = assignAnonymousNames([d(0, -1, 1), d(3, 10), d(1, 11)], names);
    const b = assignAnonymousNames([d(7, 11), d(2, 10)], names);
    expect(a.has(0)).toBe(false);
    expect(a.get(3)).toBe('B'); // 10 % 3
    expect(a.get(3)).toBe(b.get(2));
    expect(a.get(1)).toBe(b.get(7));
  });

  it('probes to the next free name on collision, lower UserID wins', () => {
    const m = assignAnonymousNames([d(0, 13), d(1, 10)], names);
    expect(m.get(1)).toBe('B');
    expect(m.get(0)).toBe('C');
  });

  it('suffixes names once the pool is exhausted', () => {
    const m = assignAnonymousNames([d(0, 0), d(1, 1), d(2, 2), d(3, 3)], names);
    expect(new Set(m.values()).size).toBe(4);
    expect(m.get(3)).toBe('A 2');
  });

  it('uses the personal alias for the player only', () => {
    const m = assignAnonymousNames([d(0, 10), d(1, 11)], names, 'Me', 1);
    expect(m.get(1)).toBe('Me');
    expect(m.get(0)).toBe('B');
  });
});
