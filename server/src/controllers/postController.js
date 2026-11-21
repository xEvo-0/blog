import Post from "../models/Post.js";
import { createSlug } from "../utils/slug.js";
import { removeUpload } from "../utils/uploads.js";

function parseTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags !== "string" || !tags.trim()) return [];
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function postData(body, imageUrl) {
  return {
    title: body.title,
    excerpt: body.excerpt?.trim() || body.content?.trim().slice(0, 180) || "",
    content: body.content,
    category: body.category || "Notes",
    tags: parseTags(body.tags),
    ...(imageUrl ? { coverImage: imageUrl } : {})
  };
}

export async function listPosts(request, response) {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(request.query.limit, 10) || 9));
  const filter = {};
  const search = typeof request.query.q === "string" ? request.query.q.trim() : "";
  const category = typeof request.query.category === "string" ? request.query.category.trim() : "";

  if (search) filter.$text = { $search: search };
  if (category && category !== "All") filter.category = category;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort(search ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug excerpt category tags coverImage createdAt updatedAt")
      .lean(),
    Post.countDocuments(filter)
  ]);

  response.json({
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}

export async function getPost(request, response) {
  const post = await Post.findOne({ slug: request.params.slug })
    .populate("author", "username")
    .lean();
  if (!post) return response.status(404).json({ message: "Post not found." });
  return response.json({ post });
}

export async function createPost(request, response) {
  const post = await Post.create({
    ...postData(request.body, request.file ? `/uploads/${request.file.filename}` : ""),
    slug: createSlug(request.body.title || ""),
    ...(request.user.role === "author" ? { author: request.user.sub } : {})
  });

  response.status(201).json({ post });
}

export async function updatePost(request, response) {
  const post = request.post || await Post.findOne({ slug: request.params.slug });
  if (!post) {
    if (request.file) await removeUpload(`/uploads/${request.file.filename}`);
    return response.status(404).json({ message: "Post not found." });
  }

  const previousImage = post.coverImage;
  const updated = await Post.findOneAndUpdate(
    { _id: post._id },
    postData(request.body, request.file ? `/uploads/${request.file.filename}` : ""),
    { new: true, runValidators: true }
  );

  if (request.file && previousImage) await removeUpload(previousImage);
  response.json({ post: updated });
}

export async function deletePost(request, response) {
  const post = request.post
    ? await Post.findByIdAndDelete(request.post._id)
    : await Post.findOneAndDelete({ slug: request.params.slug });
  if (!post) return response.status(404).json({ message: "Post not found." });
  if (post.coverImage) await removeUpload(post.coverImage);
  response.json({ message: "Post deleted." });
}

export async function listCategories(_request, response) {
  const categories = await Post.distinct("category", { category: { $ne: "" } });
  response.json({ categories: categories.sort((left, right) => left.localeCompare(right)) });
}
