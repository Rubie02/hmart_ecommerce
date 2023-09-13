const express = require("express");
const { createUser, loginUserCotroller, getAllUser, getAUser } = require("../controller/userController");
const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUserCotroller);
router.get('/', getAllUser);
router.get('/:id', getAUser);

module.exports = router;