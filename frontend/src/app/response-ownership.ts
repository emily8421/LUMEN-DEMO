export type ResponseTicket = Readonly<{
  scope: string;
  generation: number;
}>;

export type KeyedResponseTicket = Readonly<{
  key: string;
  ticket: ResponseTicket;
}>;

/**
 * Tracks which async read still owns a state commit.
 *
 * A scope change invalidates all prior tickets. Within one scope, only the
 * most recently started read owns the next commit.
 */
export function createResponseOwnership(initialScope = '') {
  let scope = initialScope;
  let generation = 0;

  return {
    setScope(nextScope: string) {
      if (scope !== nextScope) {
        scope = nextScope;
        generation += 1;
      }
    },
    isCurrentScope(expectedScope: string) {
      return scope === expectedScope;
    },
    begin(): ResponseTicket {
      generation += 1;
      return { scope, generation };
    },
    owns(ticket: ResponseTicket) {
      return ticket.scope === scope && ticket.generation === generation;
    },
  };
}

/** Keeps unrelated resources independently current within the same scope. */
export function createKeyedResponseOwnership(initialScope = '') {
  let scope = initialScope;
  const ownershipByKey = new Map<string, ReturnType<typeof createResponseOwnership>>();

  function ownershipFor(key: string) {
    let ownership = ownershipByKey.get(key);
    if (!ownership) {
      ownership = createResponseOwnership(scope);
      ownershipByKey.set(key, ownership);
    }
    return ownership;
  }

  return {
    setScope(nextScope: string) {
      if (scope !== nextScope) {
        scope = nextScope;
        ownershipByKey.forEach((ownership) => ownership.setScope(nextScope));
      }
    },
    isCurrentScope(expectedScope: string) {
      return scope === expectedScope;
    },
    begin(key: string): KeyedResponseTicket {
      return { key, ticket: ownershipFor(key).begin() };
    },
    owns(ticket: KeyedResponseTicket) {
      return ownershipFor(ticket.key).owns(ticket.ticket);
    },
  };
}
