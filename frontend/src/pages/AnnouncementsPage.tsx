import { useCallback, useEffect, useState } from "react";
import * as api from "../api";
import type { Announcement } from "../types";
import { Icon } from "../components/Icon";

export function AnnouncementsPage({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", author: "Administration", audience: "ALL STUDENTS" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return api
      .getAnnouncements()
      .then((list) => {
        setItems(list);
        setError(null);
        onCountChange?.(list.length);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load announcements");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createAnnouncement(form);
      setForm({ title: "", body: "", author: "Administration", audience: "ALL STUDENTS" });
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteAnnouncement(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="students-page">
      <div className="students-toolbar">
        <div>
          <h2>Announcements</h2>
          <p className="muted">School-wide news posted by staff and administration.</p>
        </div>
        <button className="btn-dark" onClick={() => { setFormError(null); setOpen(true); }}>
          <Icon name="plus" size={16} /> New Announcement
        </button>
      </div>

      {error && <p className="table-empty">{error}</p>}

      <div className="announcement-grid">
        {loading ? (
          <p className="table-empty">Loading announcements…</p>
        ) : (
          items.map((a) => (
            <article key={a.id} className="card announcement-card">
              <div className="announcement-head">
                <span className="event-badge"><Icon name="announcements" size={16} /></span>
                <div>
                  <h3>{a.title}</h3>
                  <small>
                    {a.audience} · {a.author} · {a.date}
                  </small>
                </div>
                <button className="icon-btn danger" onClick={() => remove(a.id)} aria-label="Delete">
                  <Icon name="trash" size={16} />
                </button>
              </div>
              <p>{a.body}</p>
            </article>
          ))
        )}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>New Announcement</h3>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <form className="form-grid" onSubmit={submit}>
              <label>
                Title
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="full">
                Body
                <textarea required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </label>
              <label>
                Author
                <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </label>
              <label>
                Audience
                <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
              </label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="btn-light" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn-dark" disabled={saving}>
                  {saving ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
