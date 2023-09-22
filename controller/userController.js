const { generateToken } = require('../config/jwtToken');
const user = require('../models/userModel');
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require('../utils/validateMongodbId');
const { generateRefreshToken } = require('../config/refreshToken');
const jwt = require("jsonwebtoken");
const { sendEmail } = require('./emailController');
const crypto = require("crypto");

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
        const refreshToken = generateRefreshToken(findUser?.id);
        const updateUser = await user.findByIdAndUpdate(findUser?.id, {
            refreshToken: refreshToken
        }, {new: true});
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24*60*60*1000
        });
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

const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const User = await user.findOne({ refreshToken });
    if (!User) throw new Error(" No Refresh token present in db or not matched");
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || User.id !== decoded.id) {
        throw new Error("There is something wrong with refresh token");
        }
        const accessToken = generateToken(User?._id);
        res.json({ accessToken });
    });
});

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const User = await user.findOne({ refreshToken });
    if (!User) {
        res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        });
        return res.sendStatus(204); // forbidden
    }
    await user.findOneAndUpdate(refreshToken, {
        refreshToken: "",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    res.sendStatus(204); // forbidden
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
    validateMongoDbId(id);
    try {
        const getUser = await user.findById(id);
        res.json(getUser);
    } catch(error) {
        throw new Error(error);
    }
});

const deleteAUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const deleteUser = await user.findByIdAndDelete(id);
        res.json(deleteUser);
    } catch(error) {
        throw new Error(error);
    }
});

const updateAUser = asyncHandler(async(req, res) => {
    const {_id} = req.user;
    const findUser = await user.findById(_id);
    if (!findUser) {
        throw new Error("User doesnot exist!");
    }
    validateMongoDbId(_id);
    try {
        const updateUser = await user.findByIdAndUpdate(_id, {
            firstName: req?.body?.firstName,
            lastName: req?.body?.lastName,
            email: req?.body?.email,
            phoneNumber: req?.body?.phoneNumber,
        }, { new: true });
        res.json(updateUser);
    } catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const block = await user.findByIdAndUpdate(id, {
            isBLocked: true
        }, { new: true});
        res.json(block);
    } catch (error) {
        throw new Error(error);
    }
});

const unblockUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const unblock = await user.findByIdAndUpdate(id, {
            isBLocked: false
        }, { new: true});
        res.json({
            message: "User unblocked!"
        })
    } catch (error) {
        throw new Error(error);
    }
});

const updatePassword = asyncHandler(async(req, res) => {
    const {_id} = req.user;
    const {password} = req.body;
    validateMongoDbId(_id);
    const User = await user.findById(_id);
    if (password) {
        User.password = password;
        const updatedPassword = await User.save();
        res.json(updatedPassword);
    } else {
        res.json(user);
    }
});

const forgotPasswordToken = asyncHandler(async(req, res) => {
    const { email } = req.body;
    const User = await user.findOne({ email });
    if (!User) throw new Error("User not found!");
    try {
        const token = await User.createPasswordResetToken();
        await User.save();
        const resetUrl = `Hi, Please follow this link to seset your password. This link is valid 10 minutes! <a href="http://localhost:4000/api/users/reset-password/${token}">Click</a>`;
        const data = {
            to: email,
            text: `Dear ${User.firstName},`,
            subject: "Forgot Password Link",
            html: resetUrl
        };
        sendEmail(data);
        res.json(token);
    } catch (error) {
        throw new Error(error);
    }
});

const resetPassword = asyncHandler(async(req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const User = await user.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    if (!User) throw new Error("Token expires, please try again");
    User.password = password;
    User.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await User.save();
    res.json(User);
});


module.exports = { createUser, loginUserCotroller, getAllUser, 
    getAUser, deleteAUser, updateAUser, blockUser, unblockUser,
    handleRefreshToken, logout, updatePassword, forgotPasswordToken,
    resetPassword}