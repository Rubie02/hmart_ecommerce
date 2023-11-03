const express = require('express');
const { createProduct, 
    getProduct, getAllProduct, 
    updateProduct, deleteProduct, 
    addToWishList, rating, getProductRecommenders} = require('../controller/productController');
const { isAdmin, authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();


router.post('/', authMiddleware, isAdmin, createProduct);
router.get('/:id', getProduct);
router.put('/:id', authMiddleware, isAdmin, updateProduct);
router.put('/wishList', authMiddleware, addToWishList);
router.put('/rating', authMiddleware, rating);
router.get('/', getAllProduct);
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);
router.get('/recommenders', authMiddleware, getProductRecommenders);


module.exports = router;