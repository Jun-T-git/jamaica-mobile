import { ProblemData } from '../types';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateProblemExhaustive(): ProblemData {
  // Generate a variety of problems with different difficulty levels
  const problemType = randomInt(1, 3);
  
  switch (problemType) {
    case 1:
      return generateAdditionProblem();
    case 2:
      return generateMultiplicationProblem();
    default:
      return generateMixedProblem();
  }
}

function generateAdditionProblem(): ProblemData {
  const a = randomInt(1, 6);
  const b = randomInt(1, 6);
  const target = a + b;
  const numbers = [a, b, randomInt(1, 6), randomInt(1, 6), randomInt(1, 6)];
  
  return {
    numbers: shuffle(numbers),
    target,
    solutions: [`${a} + ${b} = ${target}`],
    difficulty: 'easy',
  };
}

function generateMultiplicationProblem(): ProblemData {
  const a = randomInt(2, 4);
  const b = randomInt(2, 4);
  const target = a * b;
  const numbers = [a, b, randomInt(1, 6), randomInt(1, 6), randomInt(1, 6)];
  
  return {
    numbers: shuffle(numbers),
    target,
    solutions: [`${a} × ${b} = ${target}`],
    difficulty: 'normal',
  };
}

function generateMixedProblem(): ProblemData {
  const a = randomInt(1, 6);
  const b = randomInt(1, 6);
  const c = randomInt(1, 6);
  const target = a + b * c;
  const numbers = [a, b, c, randomInt(1, 6), randomInt(1, 6)];
  
  return {
    numbers: shuffle(numbers),
    target,
    solutions: [`${a} + ${b} × ${c} = ${target}`],
    difficulty: 'hard',
  };
}

