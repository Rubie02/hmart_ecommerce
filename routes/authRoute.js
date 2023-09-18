const express = require("express");
const { createUser, loginUserCotroller, getAllUser, getAUser, deleteAUser, updateAUser, blockUser, unblockUser, handleRefreshToken, logout } = require("../controller/userController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUserCotroller);
router.get('/', authMiddleware, isAdmin, getAllUser);
router.get('/:id', authMiddleware, getAUser);
router.get('/refresh', handleRefreshToken);
router.get('/logout', logout);
router.delete('/:id', authMiddleware, isAdmin, deleteAUser);
router.put('/update', authMiddleware, updateAUser);
router.put('/block-user/:id', authMiddleware, isAdmin, blockUser);
router.put('/unblock-user/:id', authMiddleware, isAdmin, unblockUser);


module.exports = router;