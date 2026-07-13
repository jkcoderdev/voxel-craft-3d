import alea from 'alea';

export type RandomFunction = () => number;

export function PRNG(seed?: number): RandomFunction {
  return typeof seed === 'number' ? alea(seed) : Math.random;
}