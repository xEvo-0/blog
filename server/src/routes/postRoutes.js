import { Router } from "express";
import {
  createPost,
  deletePost,
  getPost,
  listCategories,
  listPosts,
  updatePost
} from "../controllers/postController.js";
import { uploadCover } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticateToken, authorizePostOwner, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", asyncHandler(listPosts));
router.get("/categories", asyncHandler(listCategories));
router.get("/:slug", asyncHandler(getPost));
router.post("/", authenticateToken, authorizeRoles("admin", "author"), uploadCover, asyncHandler(createPost));
router.put("/:slug", authenticateToken, authorizeRoles("admin", "author"), asyncHandler(authorizePostOwner), uploadCover, asyncHandler(updatePost));
router.delete("/:slug", authenticateToken, authorizeRoles("admin", "author"), asyncHandler(authorizePostOwner), asyncHandler(deletePost));

export default router;
