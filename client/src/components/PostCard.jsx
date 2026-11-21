import { ArrowUpRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../api/posts.js";

function readingTime(content = "") {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

export default function PostCard({ post, featured = false }) {
  return (
    <article className={`post-card${featured ? " post-card-featured" : ""}`}>
      <Link className="post-image-link" to={`/post/${post.slug}`} aria-label={`Read ${post.title}`}>
        {post.coverImage ? (
          <img className="post-image" src={getImageUrl(post.coverImage)} alt="" />
        ) : (
          <div className={`image-placeholder placeholder-${post.category.length % 4}`}>
            <span>{post.category}</span>
          </div>
        )}
        {featured && <span className="featured-label">EDITOR&apos;S PICK</span>}
      </Link>
      <div className="post-card-body">
        <div className="post-meta">
          <span className="category-label">{post.category || "Notes"}</span>
          <span className="meta-dot" />
          <span>{new Date(post.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
        </div>
        <Link className="post-title-link" to={`/post/${post.slug}`}>
          <h2>{post.title}<ArrowUpRight className="title-arrow" size={18} /></h2>
        </Link>
        <p className="post-excerpt">{post.excerpt || post.content?.slice(0, 150)}</p>
        <div className="post-card-footer">
          <span className="read-time"><Clock3 size={14} /> {readingTime(post.content)} min read</span>
          <Link className="read-link" to={`/post/${post.slug}`}>Read story <span>↗</span></Link>
        </div>
      </div>
    </article>
  );
}
