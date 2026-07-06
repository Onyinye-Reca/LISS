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
import { apiFetch, API_BASE } from "./api";

/** Direct link to the Electoral Committee's audit CSV (session-gated, admin). */
export function electionAuditCsvUrl(id: string): string {
  return `${API_BASE}/elections/${id}/audit.csv`;
}

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

/** EC-scoped candidate photo upload (returns the stored URL). */
export async function uploadCandidatePhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/elections/candidate-photo", { method: "POST", body: form });
  return ok(res, (d: { url: string }) => d.url, "Could not upload photo");
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
