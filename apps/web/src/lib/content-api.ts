import {
  OfficerView,
  OfficerCreateInput,
  OfficerUpdateInput,
  BotMemberView,
  BotMemberCreateInput,
  BotMemberUpdateInput,
  RegionView,
  RegionKey,
  RegionUpdateInput,
} from "@liss11/shared";
import { apiFetch } from "./api";

async function ok<T>(res: Response, pick: (d: never) => T, fallback: string): Promise<T> {
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? fallback);
  }
  return pick((await res.json()) as never);
}

// --- Officers / EXCOS ---
export async function getOfficers(): Promise<OfficerView[]> {
  const res = await apiFetch("/officers");
  return ok(res, (d: { officers: OfficerView[] }) => d.officers, "Failed to load officers");
}
export async function createOfficer(input: OfficerCreateInput): Promise<OfficerView> {
  const res = await apiFetch("/officers", { method: "POST", body: JSON.stringify(input) });
  return ok(res, (d: { officer: OfficerView }) => d.officer, "Could not create officer");
}
export async function updateOfficer(id: string, input: OfficerUpdateInput): Promise<OfficerView> {
  const res = await apiFetch(`/officers/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return ok(res, (d: { officer: OfficerView }) => d.officer, "Could not update officer");
}
export async function deleteOfficer(id: string): Promise<void> {
  const res = await apiFetch(`/officers/${id}`, { method: "DELETE" });
  await ok(res, () => undefined, "Could not delete officer");
}

// --- BOT ---
export async function getBotMembers(): Promise<BotMemberView[]> {
  const res = await apiFetch("/bot");
  return ok(res, (d: { members: BotMemberView[] }) => d.members, "Failed to load BOT");
}
export async function createBotMember(input: BotMemberCreateInput): Promise<BotMemberView> {
  const res = await apiFetch("/bot", { method: "POST", body: JSON.stringify(input) });
  return ok(res, (d: { member: BotMemberView }) => d.member, "Could not create BOT member");
}
export async function updateBotMember(id: string, input: BotMemberUpdateInput): Promise<BotMemberView> {
  const res = await apiFetch(`/bot/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return ok(res, (d: { member: BotMemberView }) => d.member, "Could not update BOT member");
}
export async function deleteBotMember(id: string): Promise<void> {
  const res = await apiFetch(`/bot/${id}`, { method: "DELETE" });
  await ok(res, () => undefined, "Could not delete BOT member");
}

// --- Regions ---
export async function getRegions(): Promise<RegionView[]> {
  const res = await apiFetch("/regions");
  return ok(res, (d: { regions: RegionView[] }) => d.regions, "Failed to load regions");
}
export async function updateRegion(key: RegionKey, input: RegionUpdateInput): Promise<RegionView> {
  const res = await apiFetch(`/regions/${key}`, { method: "PUT", body: JSON.stringify(input) });
  return ok(res, (d: { region: RegionView }) => d.region, "Could not update region");
}

// --- Image upload ---
export async function uploadImage(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append("folder", folder);
  form.append("file", file);
  const res = await apiFetch("/admin/uploads", { method: "POST", body: form });
  return ok(res, (d: { url: string }) => d.url, "Upload failed");
}
