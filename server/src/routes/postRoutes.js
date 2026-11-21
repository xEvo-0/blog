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
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", asyncHandler(listPosts));
router.get("/categories", asyncHandler(listCategories));
router.get("/:slug", asyncHandler(getPost));
router.post("/", authenticateToken, authorizeRoles("admin"), uploadCover, asyncHandler(createPost));
router.put("/:slug", authenticateToken, authorizeRoles("admin"), uploadCover, asyncHandler(updatePost));
router.delete("/:slug", authenticateToken, authorizeRoles("admin"), asyncHandler(deletePost));

export default router;
