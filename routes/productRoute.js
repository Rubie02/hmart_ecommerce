const express = require('express');
const { createProduct, 
    getProduct, getAllProduct, 
    updateProduct, deleteProduct, 
    addToWishList, rating, uploadImages, deleteImages } = require('../controller/productController');
const { isAdmin, authMiddleware } = require('../middlewares/authMiddleware');
const { uploadPhoto, productImgResize } = require('../middlewares/uploadImages');
const router = express.Router();

router.post('/', authMiddleware, isAdmin, createProduct);
router.put(
    '/upload', 
    authMiddleware, 
    isAdmin, 
    uploadPhoto.array('images', 10), 
    productImgResize,
    uploadImages);
router.get('/:id', getProduct);
router.put('/:id', authMiddleware, isAdmin, updateProduct);
router.put('/wishList', authMiddleware, addToWishList);
router.put('/rating', authMiddleware, rating);
router.get('/', getAllProduct);
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);
router.delete('/delete-img/:id', authMiddleware, isAdmin, deleteImages);


module.exports = router;