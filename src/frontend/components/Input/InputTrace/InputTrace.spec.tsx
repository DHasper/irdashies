import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getColor } from '@irdashies/utils/colors';
import { InputTrace } from './InputTrace';

const d = (container: HTMLElement, color: string) =>
  container.querySelector(`path[stroke="${color}"]`)?.getAttribute('d');

describe('InputTrace', () => {
  it('draws the traces on commit without waiting for an animation frame', () => {
    const { container, rerender } = render(
      <InputTrace input={{ throttle: 0, brake: 0 }} />
    );

    rerender(<InputTrace input={{ throttle: 1, brake: 0.5 }} />);

    expect(d(container, getColor('green'))).toMatch(/^M/);
    expect(d(container, getColor('red'))).toMatch(/^M/);
  });
});
