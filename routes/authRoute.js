const express = require("express");
const { createUser, loginUserCotroller, 
    getAllUser, getAUser, deleteAUser, 
    updateAUser, blockUser, unblockUser, 
    handleRefreshToken, logout, updatePassword, 
    forgotPasswordToken, resetPassword, adminLogin, getWishList, saveAddress, userCart, getCart, emptyCart, applyCoupon, createOrder, getOrders, updateOrderStatus } = require("../controller/userController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post('/register', createUser);
router.post('/forgot-password', forgotPasswordToken);
router.put('/reset-password/:token', resetPassword);
router.put('/orders/:id', authMiddleware, isAdmin, updateOrderStatus);
router.put('/password', authMiddleware, updatePassword);
router.post('/login', loginUserCotroller);
router.post('/admin-login', adminLogin);
router.post('/cart', authMiddleware, userCart);
router.post('/cart/coupon', authMiddleware, applyCoupon);
router.post('/cart/order', authMiddleware, createOrder);
router.get('/wishList', authMiddleware, getWishList);
router.get('/cart', authMiddleware, getCart);
router.get('/', authMiddleware, isAdmin, getAllUser);
router.get('/orders', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getAUser);
router.delete('/empty-cart', authMiddleware, emptyCart);
router.get('/refresh', handleRefreshToken);
router.get('/logout', logout);

router.delete('/:id', authMiddleware, isAdmin, deleteAUser);
router.put('/update', authMiddleware, updateAUser);
router.put('/save-address', authMiddleware, saveAddress);
router.put('/block-user/:id', authMiddleware, isAdmin, blockUser);
router.put('/unblock-user/:id', authMiddleware, isAdmin, unblockUser);



module.exports = router;