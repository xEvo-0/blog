import { ArrowLeft, ArrowRight, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { getAuthToken, login, setAuthToken } from "./api/auth.js";
import { deletePost, getCategories, getPost, getPosts, getImageUrl, savePost } from "./api/posts.js";
import Header from "./components/Header.jsx";
import Loading from "./components/Loading.jsx";
import PostCard from "./components/PostCard.jsx";
import PostEditor from "./components/PostEditor.jsx";

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories().then((result) => setCategories(result.categories)).catch((reason) => setError(reason.message));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      getPosts({ page, q: query.trim(), category })
        .then((result) => {
          if (!active) return;
          setPosts(result.posts);
          setPagination(result.pagination);
        })
        .catch((reason) => {
          if (active) setError(reason.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [page, query, category]);

  const featured = posts[0];
  const remaining = posts.slice(1);
  const hasFilters = Boolean(query.trim()) || category !== "All";

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE SPACE FOR BIG IDEAS</div>
          <h1>Stories worth<br />slowing down <em>for.</em></h1>
          <p>Thoughtful writing on the things that move us, made by people who care.</p>
          <a className="hero-link" href="#stories">Find your next read <ArrowRight size={16} /></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-book"><div /><div /><div /></div>
          <span className="art-caption">VOL. 01 — IDEAS IN BLOOM</span>
          <span className="art-sparkle sparkle-one">✳</span>
          <span className="art-sparkle sparkle-two">✳</span>
        </div>
        <div className="hero-bottom">
          <span>INDEPENDENT VOICES. ENDLESS PERSPECTIVES.</span>
          <span>EST. WITH CURIOSITY <span className="tiny-star">✳</span></span>
        </div>
      </section>

      <main id="stories" className="content-wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> THE READING ROOM</div>
            <h2>{hasFilters ? "Find a story." : "Fresh from the page."}</h2>
          </div>
          <span className="story-count">{pagination.total || 0} STORIES TO EXPLORE</span>
        </div>

        <div className="discovery-bar">
          <div className="category-list" aria-label="Filter by category">
            {["All", ...categories].map((item) => (
              <button key={item} className={`category-filter${category === item ? " active" : ""}`} onClick={() => { setCategory(item); setPage(1); }}>
                {item}
              </button>
            ))}
          </div>
          <label className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search stories..." aria-label="Search stories" />
            {query && <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
          </label>
        </div>

        {error && <div className="notice error-notice" role="alert">{error} <button onClick={() => setError("")}>Dismiss</button></div>}
        {loading ? <Loading /> : posts.length ? (
          <>
            {featured && !hasFilters && page === 1 && <PostCard post={featured} featured />}
            <div className="post-grid">
              {(hasFilters || page !== 1 ? posts : remaining).map((post) => <PostCard key={post._id} post={post} />)}
            </div>
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="button button-outline" disabled={page <= 1} onClick={() => { setPage(page - 1); document.getElementById("stories")?.scrollIntoView({ behavior: "smooth" }); }}><ArrowLeft size={15} /> Newer</button>
                <span>PAGE {page} OF {pagination.pages}</span>
                <button className="button button-outline" disabled={page >= pagination.pages} onClick={() => { setPage(page + 1); document.getElementById("stories")?.scrollIntoView({ behavior: "smooth" }); }}>Older <ArrowRight size={15} /></button>
              </div>
            )}
          </>
        ) : !error ? (
          <div className="empty-state">
            <span className="empty-icon"><Sparkles size={22} /></span>
            <h3>{hasFilters ? "No stories found just yet." : "A blank page, full of possibility."}</h3>
            <p>{hasFilters ? "Try another search or category." : "Every great collection starts with one story. Yours could be first."}</p>
            <Link className="button button-dark" to="/write">{hasFilters ? "Clear your search" : "Write the first story"}</Link>
          </div>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

function EditorPage({ editing = false, isAuthenticated }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing || !isAuthenticated) return;
    getPost(slug)
      .then((result) => setPost(result.post))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [editing, isAuthenticated, slug]);

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  async function submit(formData) {
    setBusy(true);
    setError("");
    try {
      const result = await savePost(formData, editing ? slug : "");
      navigate(`/post/${result.post.slug}`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="page-wrap"><Loading /></main>;
  if (editing && error && !post) return <main className="page-wrap"><ErrorPanel message={error} /></main>;

  return (
    <>
      <main className="page-wrap editor-page">
        <Link className="back-link" to={editing ? `/post/${slug}` : "/"}><ArrowLeft size={15} /> {editing ? "Back to story" : "Back to stories"}</Link>
        <div className="page-intro">
          <div className="eyebrow"><span className="eyebrow-line" /> {editing ? "MAKE IT YOURS" : "YOUR WORDS, YOUR WAY"}</div>
          <h1>{editing ? "Edit your story." : "Start with a story."}</h1>
          <p>{editing ? "Good stories grow. Make a change, and let it find its readers." : "The best time to write it was yesterday. The next best time is now."}</p>
        </div>
        <PostEditor initialPost={post} onSubmit={submit} busy={busy} error={error} />
      </main>
      <Footer />
    </>
  );
}

function PostPage({ isAuthenticated }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPost(slug)
      .then((result) => setPost(result.post))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [slug]);

  async function remove() {
    if (!window.confirm("Delete this story? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deletePost(slug);
      navigate("/");
    } catch (reason) {
      setError(reason.message);
      setDeleting(false);
    }
  }

  if (loading) return <main className="page-wrap"><Loading /></main>;
  if (!post) return <main className="page-wrap"><ErrorPanel message={error || "Story not found."} /></main>;

  return (
    <>
      <main className="article-wrap">
        <Link className="back-link" to="/"><ArrowLeft size={15} /> All stories</Link>
        {error && <div className="notice error-notice" role="alert">{error}</div>}
        <div className="article-head">
          <div className="post-meta"><span className="category-label">{post.category}</span><span className="meta-dot" /><span>{new Date(post.createdAt).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</span></div>
          <h1>{post.title}</h1>
          {post.excerpt && <p className="article-deck">{post.excerpt}</p>}
          <div className="article-byline">
            <div className="author-avatar">I</div>
            <div><strong>Inkwell contributor</strong><span>Just a curious person with a story</span></div>
            {isAuthenticated && <div className="article-actions">
              <Link className="button button-outline button-small" to={`/edit/${post.slug}`}>Edit story</Link>
              <button className="button button-danger button-small" onClick={remove} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>}
          </div>
        </div>
        {post.coverImage && <div className="article-cover"><img src={getImageUrl(post.coverImage)} alt="" /></div>}
        <article className="article-content">
          {post.content.split(/\r?\n/).map((paragraph, index) => paragraph.trim() ? <p key={index}>{paragraph}</p> : null)}
        </article>
        {post.tags?.length > 0 && <div className="article-tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
        <div className="article-end"><span>✳</span> Thanks for reading. Stay curious.</div>
      </main>
      <Footer />
    </>
  );
}

function ErrorPanel({ message }) {
  return <div className="empty-state error-page"><span className="empty-icon">!</span><h3>We couldn&apos;t find that page.</h3><p>{message}</p><Link className="button button-dark" to="/">Return to stories</Link></div>;
}

function Footer() {
  return <footer className="site-footer"><Link className="brand footer-brand" to="/"><span className="brand-mark"><span>i</span></span><span>inkwell<span className="brand-period">.</span></span></Link><span>Made for people who love a good story.</span><span>© {new Date().getFullYear()} INKWELL</span></footer>;
}

export default function App() {
  const [token, setToken] = useState(() => getAuthToken());
  const isAuthenticated = Boolean(token);

  function signOut() {
    setAuthToken("");
    setToken(null);
  }

  return (
    <div className="app-shell">
      <Header isAuthenticated={isAuthenticated} onLogout={signOut} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage onLogin={(nextToken) => { setAuthToken(nextToken); setToken(nextToken); }} />} />
        <Route path="/write" element={<EditorPage isAuthenticated={isAuthenticated} />} />
        <Route path="/edit/:slug" element={<EditorPage editing isAuthenticated={isAuthenticated} />} />
        <Route path="/post/:slug" element={<PostPage isAuthenticated={isAuthenticated} />} />
        <Route path="*" element={<main className="page-wrap"><ErrorPanel message="That page doesn't exist." /></main>} />
      </Routes>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const destination = location.state?.from?.pathname || "/write";

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await login(username, password);
      onLogin(result.token);
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <main className="page-wrap">
        <div className="page-intro">
          <div className="eyebrow"><span className="eyebrow-line" /> ADMIN ACCESS</div>
          <h1>Welcome back.</h1>
          <p>Sign in to write and manage stories.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label className="field-label" htmlFor="admin-username">USERNAME</label>
          <input id="admin-username" className="side-input" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          <label className="field-label" htmlFor="admin-password">PASSWORD</label>
          <input id="admin-password" className="side-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button button-dark" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
