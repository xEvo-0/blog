import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A title is required."],
      trim: true,
      minlength: 3,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 240,
      default: ""
    },
    content: {
      type: String,
      required: [true, "Post content is required."],
      trim: true,
      minlength: 1
    },
    category: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "Notes"
    },
    tags: {
      type: [String],
      default: []
    },
    coverImage: {
      type: String,
      default: ""
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

postSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
