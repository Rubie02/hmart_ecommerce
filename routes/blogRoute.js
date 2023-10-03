const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { createBlog, updateBlog, getBlog, getBlogs, deleteBlog, liketheBlog, disliketheBlog } = require("../controller/blogController");
const router = express.Router();

router.post('/', authMiddleware, isAdmin, createBlog);
router.put('/:id', authMiddleware, isAdmin, updateBlog);
router.get('/:id', getBlog);
router.get('/', getBlogs);
router.delete('/:id', authMiddleware, isAdmin, deleteBlog);
router.put('/likes', authMiddleware, liketheBlog);
router.put('/dislikes', authMiddleware, disliketheBlog);

module.exports = router;