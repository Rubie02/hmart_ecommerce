const user = require('../models/userModel');
const asyncHandler = require("express-async-handler");

const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await user.findOne({email});
    if (!findUser) {
        const newUser = await user.create(req.body);
        res.json(newUser);
    } else {
        throw new Error('User already exist');
    }
});

const loginUserCotroller = asyncHandler(async(req, res) => {
    const { email, password} = req.body;
    console.log(email, password);
});

module.exports = { createUser, loginUserCotroller }