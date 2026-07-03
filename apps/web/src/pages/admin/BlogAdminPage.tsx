import { FormEvent, useEffect, useState } from "react";
import { BlogPostView, BlogPostCreateInput } from "@liss11/shared";
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../../lib/content-api";
import { Button, TextField, TextArea, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";
import { formatDate, toDateInput } from "../../lib/format";
import { useAuth } from "../../auth/AuthContext";

type FormState = {
  title: string;
  author: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string;
  isPublished: boolean;
};

function toForm(p: BlogPostView): FormState {
  return {
    title: p.title,
    author: p.author,
    excerpt: p.excerpt ?? "",
    body: p.body,
    coverUrl: p.coverUrl,
    publishedAt: toDateInput(p.publishedAt),
    isPublished: p.isPublished,
  };
}

function toPayload(f: FormState): BlogPostCreateInput {
  return {
    title: f.title,
    author: f.author,
    excerpt: f.excerpt || null,
    body: f.body,
    coverUrl: f.coverUrl,
    publishedAt: f.publishedAt || null,
    isPublished: f.isPublished,
  };
}

export default function BlogAdminPage() {
  const { member } = useAuth();
  const [posts, setPosts] = useState<BlogPostView[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const blank: FormState = {
    title: "",
    author: member ? `${member.firstName} ${member.lastName}` : "",
    excerpt: "",
    body: "",
    coverUrl: null,
    publishedAt: "",
    isPublished: true,
  };

  const refresh = () => getBlogPosts().then(setPosts).catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const payload = toPayload(editing.form);
      if (editing.id) await updateBlogPost(editing.id, payload);
      else await createBlogPost(payload);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: BlogPostView) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteBlogPost(p.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const set = (patch: Partial<FormState>) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-maroon">Blog</h1>
        {!editing && (
          <Button type="button" onClick={() => setEditing({ id: null, form: blank })} className="w-auto px-4">
            New post
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {editing && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
          <h2 className="font-semibold text-maroon">{editing.id ? "Edit" : "New"} post</h2>
          <ImageUpload
            label="Cover image (optional)"
            shape="rect"
            value={editing.form.coverUrl}
            folder="blog"
            onChange={(url) => set({ coverUrl: url })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title" required value={editing.form.title} onChange={(e) => set({ title: e.target.value })} />
            <TextField label="Author" required value={editing.form.author} onChange={(e) => set({ author: e.target.value })} />
          </div>
          <TextField label="Excerpt (optional teaser)" value={editing.form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
          <TextArea label="Body" required rows={12} value={editing.form.body} onChange={(e) => set({ body: e.target.value })} />
          <TextField
            label="Publish date (optional - defaults to today)"
            type="date"
            value={editing.form.publishedAt}
            onChange={(e) => set({ publishedAt: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={editing.form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} />
            Published (uncheck to save as a draft - hidden from the public)
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Saving…" : "Save"}</Button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-medium text-ink/60 underline">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {posts.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No posts yet. Write the first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Published</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-medium text-nearblack">{p.title}</td>
                  <td className="px-4 py-2">
                    {p.isPublished ? (
                      <span className="text-success">Published</span>
                    ) : (
                      <span className="text-ink/50">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink/60">{formatDate(p.publishedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setEditing({ id: p.id, form: toForm(p) })} className="mr-3 font-medium text-maroon hover:underline">Edit</button>
                    <button onClick={() => void remove(p)} className="font-medium text-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
