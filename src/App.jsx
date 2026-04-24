import { useState, useEffect, useCallback } from "react";
import "./App.css";
 
const API = "http://localhost:3000/api";
 
// ─── API helpers ──────────────────────────────────────────────────────────────
const api = {
  headers: (token) => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }),
  get: (url, token) =>
    fetch(`${API}${url}`, { headers: api.headers(token) }).then((r) => r.json()),
  post: (url, body, token) =>
    fetch(`${API}${url}`, {
      method: "POST",
      headers: api.headers(token),
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  put: (url, body, token) =>
    fetch(`${API}${url}`, {
      method: "PUT",
      headers: api.headers(token),
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  delete: (url, token) =>
    fetch(`${API}${url}`, {
      method: "DELETE",
      headers: api.headers(token),
    }).then((r) => r.json()),
};
 
// ─── Formatters ───────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
 
const roleColor = { admin: "#e63946", writer: "#2a9d8f", guest: "#6c757d" };
 
// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>✕</button>
    </div>
  );
}
 
// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{title}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
 
// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin, showToast }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/auth/login", form);
      if (data.token) {
        onLogin(data.token, data.user);
        showToast(`Welcome back, ${data.user.name}!`, "success");
      } else {
        showToast(data.message || "Login failed.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <div className="brand-icon">✦</div>
          <h1>The Joy-Blog</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div className="login-card__hint">
          <p>Demo accounts</p>
          <div className="demo-accounts">
            {[
              { role: "admin", email: "admin@blog.com", pw: "password" },
              { role: "writer", email: "writer@blog.com", pw: "password" },
              { role: "guest", email: "guest@blog.com", pw: "password" },
            ].map((a) => (
              <button
                key={a.role}
                className="demo-btn"
                onClick={() => setForm({ email: a.email, password: a.pw })}
                style={{ "--role-color": roleColor[a.role] }}
              >
                <span className="demo-btn__role">{a.role}</span>
                <span className="demo-btn__email">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="login-bg">
        <div className="login-bg__text">
          <blockquote>"A blog is your unfiltered voice — raw, real, and reaching."</blockquote>
        </div>
      </div>
    </div>
  );
}
 
// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, user, onView, onEdit, onDelete }) {
  const canEdit =
    user && (user.role === "admin" || (user.role === "writer" && String(user.id) === String(post.author_id)));
  const canDelete = user && user.role === "admin";
 
  return (
    <article className="post-card" onClick={() => onView(post)}>
      <div className="post-card__meta">
        <span className="post-card__author">{post.author_name}</span>
        <span className="post-card__dot">·</span>
        <span className="post-card__date">{formatDate(post.created_at)}</span>
      </div>
      <h2 className="post-card__title">{post.title}</h2>
      <p className="post-card__excerpt">
        {post.content.length > 160 ? post.content.slice(0, 160) + "…" : post.content}
      </p>
      <div className="post-card__footer">
        <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); onView(post); }}>
          Read more →
        </button>
        <div className="post-card__actions">
          {canEdit && (
            <button
              className="btn btn--outline btn--sm"
              onClick={(e) => { e.stopPropagation(); onEdit(post); }}
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn--danger btn--sm"
              onClick={(e) => { e.stopPropagation(); onDelete(post); }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
 
// ─── Post View ────────────────────────────────────────────────────────────────
function PostView({ post, user, onEdit, onDelete, onBack }) {
  const canEdit =
    user && (user.role === "admin" || (user.role === "writer" && String(user.id) === String(post.author_id)));
  const canDelete = user && user.role === "admin";
 
  return (
    <div className="post-view">
      <button className="btn btn--ghost back-btn" onClick={onBack}>← Back</button>
      <article className="post-full">
        <div className="post-full__meta">
          <span className="post-card__author">{post.author_name}</span>
          <span className="post-card__dot">·</span>
          <span className="post-card__date">{formatDate(post.created_at)}</span>
          {post.updated_at !== post.created_at && (
            <span className="post-full__updated">(updated {formatDate(post.updated_at)})</span>
          )}
        </div>
        <h1 className="post-full__title">{post.title}</h1>
        <div className="post-full__content">
          {post.content.split("\n").map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="post-full__actions">
          {canEdit && (
            <button className="btn btn--outline" onClick={() => onEdit(post)}>Edit Post</button>
          )}
          {canDelete && (
            <button className="btn btn--danger" onClick={() => onDelete(post)}>Delete Post</button>
          )}
        </div>
      </article>
    </div>
  );
}
 
// ─── Post Form ────────────────────────────────────────────────────────────────
function PostForm({ post, token, onSave, onClose, showToast }) {
  const [form, setForm] = useState({
    title: post?.title || "",
    content: post?.content || "",
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!post;
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = isEdit
        ? await api.put(`/posts/${post.id}`, form, token)
        : await api.post("/posts", form, token);
 
      if (data.data) {
        showToast(isEdit ? "Post updated!" : "Post created!", "success");
        onSave(data.data);
      } else {
        showToast(data.message || "Something went wrong.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <Modal title={isEdit ? "Edit Post" : "New Post"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="post-form">
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            placeholder="Your post title…"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Content</label>
          <textarea
            placeholder="Write your story…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={10}
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
 
// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ post, token, onDelete, onClose, showToast }) {
  const [loading, setLoading] = useState(false);
 
  const handleDelete = async () => {
    setLoading(true);
    try {
      const data = await api.delete(`/posts/${post.id}`, token);
      if (data.message?.includes("deleted")) {
        showToast("Post deleted.", "success");
        onDelete(post.id);
      } else {
        showToast(data.message || "Delete failed.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <Modal title="Delete Post?" onClose={onClose}>
      <div className="delete-confirm">
        <p>Are you sure you want to delete <strong>"{post.title}"</strong>? This action cannot be undone.</p>
        <div className="form-actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
 
// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ user, onNew, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar__brand">✦ The Joy-Blog</div>
      <div className="navbar__right">
        {user && (
          <>
            <div className="navbar__user">
              <span className="navbar__name">{user.name}</span>
              <span className="navbar__role" style={{ "--role-color": roleColor[user.role] }}>
                {user.role}
              </span>
            </div>
            {(user.role === "writer" || user.role === "admin") && (
              <button className="btn btn--primary btn--sm" onClick={onNew}>
                + New Post
              </button>
            )}
            <button className="btn btn--ghost btn--sm" onClick={onLogout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
 
// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list"); // list | post
  const [activePost, setActivePost] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const LIMIT = 6;
 
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);
 
  // Fetch current user on mount if token exists
  useEffect(() => {
    if (!token) return;
    api.get("/auth/me", token).then((data) => {
      if (data.user) setUser(data.user);
      else handleLogout();
    });
  }, [token]);
 
  // Fetch posts
  const fetchPosts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get(`/posts?page=${p}&limit=${LIMIT}`);
      setPosts(data.data || []);
      setTotal(data.total || 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { fetchPosts(1); }, [fetchPosts]);
 
  const handleLogin = (t, u) => {
    localStorage.setItem("token", t);
    setToken(t);
    setUser(u);
  };
 
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setView("list");
  };
 
  const handleView = async (post) => {
    setLoading(true);
    const data = await api.get(`/posts/${post.id}`);
    setActivePost(data.data);
    setView("post");
    setLoading(false);
  };
 
  const handleSave = (savedPost) => {
    setShowForm(false);
    setEditPost(null);
    fetchPosts(page);
    if (view === "post") setActivePost(savedPost);
  };
 
  const handleDeleted = (id) => {
    setDeletePost(null);
    if (view === "post") setView("list");
    fetchPosts(page);
  };
 
  const totalPages = Math.ceil(total / LIMIT);
 
  if (!token) {
    return (
      <>
        <LoginPage onLogin={handleLogin} showToast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }
 
  return (
    <div className="app">
      <Navbar
        user={user}
        onNew={() => { setEditPost(null); setShowForm(true); }}
        onLogout={handleLogout}
      />
 
      <main className="main">
        {view === "list" && (
          <div className="blog-list">
            <header className="blog-list__header">
              <h1>Latest Stories</h1>
              <p>{total} {total === 1 ? "post" : "posts"} published</p>
            </header>
 
            {loading ? (
              <div className="loading">
                <div className="spinner" />
              </div>
            ) : posts.length === 0 ? (
              <div className="empty">
                <p>No posts yet. Be the first to write something!</p>
              </div>
            ) : (
              <div className="posts-grid">
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    user={user}
                    onView={handleView}
                    onEdit={(p) => { setEditPost(p); setShowForm(true); }}
                    onDelete={setDeletePost}
                  />
                ))}
              </div>
            )}
 
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={page === 1}
                  onClick={() => fetchPosts(page - 1)}
                >
                  ← Prev
                </button>
                <span>{page} / {totalPages}</span>
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={page === totalPages}
                  onClick={() => fetchPosts(page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
 
        {view === "post" && activePost && (
          <PostView
            post={activePost}
            user={user}
            onEdit={(p) => { setEditPost(p); setShowForm(true); }}
            onDelete={setDeletePost}
            onBack={() => setView("list")}
          />
        )}
      </main>
 
      {showForm && (
        <PostForm
          post={editPost}
          token={token}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditPost(null); }}
          showToast={showToast}
        />
      )}
 
      {deletePost && (
        <DeleteConfirm
          post={deletePost}
          token={token}
          onDelete={handleDeleted}
          onClose={() => setDeletePost(null)}
          showToast={showToast}
        />
      )}
 
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
 