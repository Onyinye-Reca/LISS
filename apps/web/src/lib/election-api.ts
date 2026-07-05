import {
  ElectionSummary,
  ElectionDetail,
  ElectionResults,
  ElectionCreateInput,
  ElectionUpdateInput,
  PositionCreateInput,
  CandidateCreateInput,
  VoteInput,
} from "@liss11/shared";
import { apiFetch } from "./api";

async function ok<T>(res: Response, pick: (d: never) => T, fallback: string): Promise<T> {
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? fallback);
  }
  return pick((await res.json()) as never);
}

// --- Member reads + voting ---
export async function getElections(): Promise<ElectionSummary[]> {
  const res = await apiFetch("/elections");
  return ok(res, (d: { elections: ElectionSummary[] }) => d.elections, "Failed to load elections");
}

export async function getElection(id: string): Promise<ElectionDetail> {
  const res = await apiFetch(`/elections/${id}`);
  return ok(res, (d: { election: ElectionDetail }) => d.election, "Failed to load election");
}

export async function getElectionResults(id: string): Promise<ElectionResults> {
  const res = await apiFetch(`/elections/${id}/results`);
  return ok(res, (d: { results: ElectionResults }) => d.results, "Failed to load results");
}

export async function castVote(id: string, input: VoteInput): Promise<void> {
  const res = await apiFetch(`/elections/${id}/vote`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  await ok(res, () => undefined, "Could not record your vote");
}

// --- Management (Electoral Committee) ---
export async function createElection(input: ElectionCreateInput): Promise<ElectionDetail> {
  const res = await apiFetch("/elections", { method: "POST", body: JSON.stringify(input) });
  return ok(res, (d: { election: ElectionDetail }) => d.election, "Could not create election");
}

export async function updateElection(id: string, input: ElectionUpdateInput): Promise<ElectionDetail> {
  const res = await apiFetch(`/elections/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return ok(res, (d: { election: ElectionDetail }) => d.election, "Could not update election");
}

export async function deleteElection(id: string): Promise<void> {
  const res = await apiFetch(`/elections/${id}`, { method: "DELETE" });
  await ok(res, () => undefined, "Could not delete election");
}

export async function addPosition(electionId: string, input: PositionCreateInput): Promise<ElectionDetail> {
  const res = await apiFetch(`/elections/${electionId}/positions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return ok(res, (d: { election: ElectionDetail }) => d.election, "Could not add position");
}

export async function deletePosition(positionId: string): Promise<void> {
  const res = await apiFetch(`/elections/positions/${positionId}`, { method: "DELETE" });
  await ok(res, () => undefined, "Could not delete position");
}

export async function addCandidate(positionId: string, input: CandidateCreateInput): Promise<void> {
  const res = await apiFetch(`/elections/positions/${positionId}/candidates`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  await ok(res, () => undefined, "Could not add candidate");
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const res = await apiFetch(`/elections/candidates/${candidateId}`, { method: "DELETE" });
  await ok(res, () => undefined, "Could not delete candidate");
}
