import { useEffect, useMemo, useState } from 'react';

import { fetchRoster } from '../chat/chatApi.js';
import type { SubagentCharacter } from '../hooks/useExtensionMessages.js';
import type { ToolActivity } from '../office/types.js';
import type { StudioActor } from './Studio3D.js';

const ROSTER_POLL_MS = 4000;

/** Display names of the agents, refreshed while the 3D office is on screen. */
function useRosterNames(active: boolean): ReadonlyMap<number, string> {
  const [names, setNames] = useState<ReadonlyMap<number, string>>(new Map());
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let timer = 0;
    const tick = async () => {
      try {
        const roster = await fetchRoster(controller.signal);
        if (roster && !controller.signal.aborted) setNames(new Map(roster.map((r) => [r.agentId, r.name])));
      } catch {
        // Offline or aborted: the next tick tries again.
      }
      if (!controller.signal.aborted) timer = window.setTimeout(() => void tick(), ROSTER_POLL_MS);
    };
    void tick();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [active]);
  return names;
}

/** What an agent is doing right now, in a few words (its newest unfinished tool). */
function currentDetail(tools: ToolActivity[] | undefined): string | undefined {
  if (!tools) return undefined;
  for (let i = tools.length - 1; i >= 0; i--) if (!tools[i].done) return tools[i].status;
  return undefined;
}

/**
 * The people of the 3D office, from the same live state the 2D office reads: every agent, working until its
 * turn ends (then it waits for Ben and goes to the lounge), and every helper it has spawned.
 */
export function useStudioActors(
  active: boolean,
  agents: number[],
  agentStatuses: Record<number, string>,
  agentTools: Record<number, ToolActivity[]>,
  helpers: SubagentCharacter[],
): StudioActor[] {
  const names = useRosterNames(active);
  return useMemo(() => {
    const out: StudioActor[] = [];
    for (const id of agents) {
      out.push({
        key: `a:${id}`,
        ownerId: id,
        name: names.get(id) ?? `Agent ${id}`,
        helper: false,
        waiting: agentStatuses[id] === 'waiting',
        detail: currentDetail(agentTools[id]),
      });
    }
    for (const h of helpers) {
      const parent = names.get(h.parentAgentId) ?? `Agent ${h.parentAgentId}`;
      out.push({
        key: `s:${h.id}`,
        ownerId: h.parentAgentId,
        name: h.label || 'Aide',
        helper: true,
        waiting: false,
        detail: `aide de ${parent}`,
      });
    }
    return out;
  }, [agents, agentStatuses, agentTools, helpers, names]);
}
