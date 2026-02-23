/**
 * Smoke test — verifies Vitest is configured correctly.
 * This test has no project-specific logic; it just exercises the runner.
 */
describe('Vitest smoke test', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('has globals available (describe / it / expect)', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });
});
