const { generateToken } = require('../config/jwtToken');
const user = require('../models/userModel');
const asyncHandler = require("express-async-handler");

const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    const findUser = await user.findOne({email});
    const findUserByPhone = await user.findOne({phoneNumber});
    if (findUserByPhone) {
        throw new Error('This phone number is already taken!');
    }
    if (!findUser) {
        const newUser = await user.create(req.body);
        res.json(newUser);
    } else {
        throw new Error('User already exist!');
    }
});

const loginUserCotroller = asyncHandler(async(req, res) => {
    const { email, password} = req.body;
    const findUser = await user.findOne({ email });
    if (findUser && await findUser.isPasswordMatched(password)) {
        res.json({
            _id: findUser?._id,
            firstName: findUser?.firstName,
            lastName: findUser?.lastName,
            email: findUser?.email,
            phoneNumber: findUser?.phoneNumber,
            token: generateToken(findUser?._id)
        });
        
    } else {
        throw new Error('Invalid credentials!');
    } 
});

const getAllUser = asyncHandler(async(req, res) => {

    try {
        const getUsers = await user.find();
        res.json(getUsers);
    } catch (error) {
        throw new Error(error);
    }
});

const getAUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
    try {
        const getUser = await user.findById(id);
        res.json(getUser);
    } catch(error) {
        throw new Error(error);
    }
});

const deleteAUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
    try {
        const deleteUser = await user.findByIdAndDelete(id);
        res.json(deleteUser);
    } catch(error) {
        throw new Error(error);
    }
});

const updateAUser = asyncHandler(async(req, res) => {
    const {id} = req.params;
    const findUser = await user.findById(id);
    if (!findUser) {
        throw new Error("User doesnot exist!");
    }
    try {
        const updateUser = await user.findByIdAndUpdate(id, {
            firstName: req?.body?.firstName,
            lastName: req?.body?.lastName,
            email: req?.body?.email,
            phoneNumber: req?.body?.phoneNumber,
        }, { new: true });
        res.json(updateUser);
    } catch (error) {
        throw new Error(error);
    }
})

module.exports = { createUser, loginUserCotroller, getAllUser, getAUser, deleteAUser, updateAUser }