const express = require("express");
const { createUser, loginUserCotroller, getAllUser, getAUser, deleteAUser, updateAUser } = require("../controller/userController");
const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUserCotroller);
router.get('/', getAllUser);
router.get('/:id', getAUser);
router.delete('/:id', deleteAUser);
router.put('/:id', updateAUser);

module.exports = router;