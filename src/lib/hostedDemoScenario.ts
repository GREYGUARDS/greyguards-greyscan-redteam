import { getDemoInjects } from "@/lib/demoInjects";
import { getDemoScenario } from "@/lib/simulationCompanies";
import type { Inject, Scenario } from "@/pages/RedTeam";
import type { Json } from "@/integrations/supabase/types";

export interface HostedDemoArtefact {
  kind: "demo";
  companyId: string;
  inject: Inject;
}

/** The one canonical script shared by public and hosted fictional-company exercises. */
export function getHostedDemoScript(companyId?: string): { scenario: Scenario; injects: Inject[] } | null {
  if (!companyId) return null;
  const preset = getDemoScenario(companyId);
  const injects = getDemoInjects(companyId);
  if (!preset || !injects) return null;
  return {
    scenario: {
      ...preset,
      id: `hosted-demo-${companyId}`,
      refCode: `DEMO-${companyId.toUpperCase()}`,
      implicatedParties: [...preset.implicatedParties],
      injects,
    },
    injects,
  };
}

/** Keeps the exact demo media and response matrix with the durable hosted inject. */
export function toHostedDemoArtefact(inject: Inject, companyId: string): Json {
  return { kind: "demo", companyId, inject: { ...inject, responseOptions: inject.responseOptions?.map(option => ({ ...option })) } } as unknown as Json;
}

export function fromHostedDemoArtefact(value: unknown): HostedDemoArtefact | null {
  if (!value || typeof value !== "object" || !("kind" in value) || value.kind !== "demo" || !("inject" in value) || !("companyId" in value)) return null;
  const artefact = value as HostedDemoArtefact;
  return artefact.inject && typeof artefact.companyId === "string" ? artefact : null;
}
