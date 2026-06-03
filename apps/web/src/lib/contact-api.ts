import { ContactInput } from "@liss11/shared";
import { apiFetch } from "./api";

export async function submitContact(input: ContactInput): Promise<string> {
  const res = await apiFetch("/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not send your message");
  }
  return data.message ?? "Thanks for reaching out. We'll be in touch.";
}
