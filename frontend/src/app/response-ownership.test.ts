import { describe, expect, it } from 'vitest';

import { createKeyedResponseOwnership, createResponseOwnership } from './response-ownership';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('response ownership', () => {
  it('accepts the latest request in the current scope', () => {
    const ownership = createResponseOwnership('token-a:space-1');
    const first = ownership.begin();
    const latest = ownership.begin();

    expect(ownership.owns(first)).toBe(false);
    expect(ownership.owns(latest)).toBe(true);
  });

  it('rejects a late response after the scope changes', () => {
    const ownership = createResponseOwnership('token-a:space-1');
    const stale = ownership.begin();

    ownership.setScope('token-a:space-2');

    expect(ownership.owns(stale)).toBe(false);
    expect(ownership.isCurrentScope('token-a:space-1')).toBe(false);
    expect(ownership.isCurrentScope('token-a:space-2')).toBe(true);
    expect(ownership.owns(ownership.begin())).toBe(true);
  });

  it('does not invalidate a request when the scope is unchanged', () => {
    const ownership = createResponseOwnership('token-a:space-1');
    const current = ownership.begin();

    ownership.setScope('token-a:space-1');

    expect(ownership.owns(current)).toBe(true);
  });

  it('keeps different resource keys current independently and invalidates both on scope change', () => {
    const ownership = createKeyedResponseOwnership('token-a:space-1');
    const root = ownership.begin('root');
    const child = ownership.begin('child-1');
    const latestRoot = ownership.begin('root');

    expect(ownership.owns(root)).toBe(false);
    expect(ownership.owns(latestRoot)).toBe(true);
    expect(ownership.owns(child)).toBe(true);

    ownership.setScope('token-a:space-2');

    expect(ownership.owns(latestRoot)).toBe(false);
    expect(ownership.owns(child)).toBe(false);
    expect(ownership.isCurrentScope('token-a:space-2')).toBe(true);
  });

  it('only commits the latest space switch when responses finish in reverse order', async () => {
    const ownership = createResponseOwnership('token-a');
    const firstResponse = createDeferred<number>();
    const latestResponse = createDeferred<number>();
    const committedSpaceIds: number[] = [];

    const commitWhenOwned = async (ticket: ReturnType<typeof ownership.begin>, response: Promise<number>) => {
      const spaceId = await response;
      if (ownership.owns(ticket)) {
        committedSpaceIds.push(spaceId);
      }
    };

    const firstCommit = commitWhenOwned(ownership.begin(), firstResponse.promise);
    const latestCommit = commitWhenOwned(ownership.begin(), latestResponse.promise);

    latestResponse.resolve(10);
    await latestCommit;
    firstResponse.resolve(20);
    await firstCommit;

    expect(committedSpaceIds).toEqual([10]);
  });
});
