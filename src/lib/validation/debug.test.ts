import { describe, it, expect } from 'vitest';

console.log('=== TEST FILE LOADED ===');
console.log('describe:', typeof describe);
console.log('it:', typeof it);
console.log('expect:', typeof expect);

describe('Debug Test', () => {
  console.log('=== INSIDE DESCRIBE ===');

  it('should work', () => {
    console.log('=== INSIDE TEST ===');
    expect(true).toBe(true);
  });
});

console.log('=== TEST FILE END ===');
