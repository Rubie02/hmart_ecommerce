const express = require("express");
const { createUser, loginUserCotroller } = require("../controller/userController");
const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUserCotroller);

module.exports = router;