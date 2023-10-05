const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { createBlog, updateBlog, getBlog, 
    getBlogs, deleteBlog, liketheBlog, 
    disliketheBlog, uploadImages } = require("../controller/blogController");
const { uploadPhoto, blogImgResize } = require("../middlewares/uploadImages");
const router = express.Router();

router.post('/', authMiddleware, isAdmin, createBlog);
router.put('/:id', authMiddleware, isAdmin, updateBlog);
router.put(
    '/upload/:id', 
    authMiddleware, 
    isAdmin, 
    uploadPhoto.array('images', 2),
    blogImgResize,
    uploadImages);
router.get('/:id', getBlog);
router.get('/', getBlogs);
router.delete('/:id', authMiddleware, isAdmin, deleteBlog);
router.put('/likes', authMiddleware, liketheBlog);
router.put('/dislikes', authMiddleware, disliketheBlog);

module.exports = router;