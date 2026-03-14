import { describe, it, expect } from 'vitest';
import { VERSION } from '../../src/core/index.js';

describe('[Core] - VERSION', () => {
  it('should export a version string', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
