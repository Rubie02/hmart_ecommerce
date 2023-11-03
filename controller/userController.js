const { generateToken } = require('../config/jwtToken');
const user = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require("../models/cartModel.js");
const Coupon = require("../models/couponModel.js");
const Order = require("../models/orderModel.js");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require('../utils/validateMongodbId');
const { generateRefreshToken } = require('../config/refreshToken');
const jwt = require("jsonwebtoken");
const { sendEmail } = require('./emailController');
const crypto = require("crypto");
const uniqid = require('uniqid');

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

const adminLogin = asyncHandler(async(req, res) => {
    const { email, password} = req.body;
    const findAdmin = await user.findOne({ email });

    if (findAdmin.role !== 'admin') {
        throw new Error('Not Authorized!');
    }

    if (findAdmin && await findAdmin.isPasswordMatched(password)) {
        const refreshToken = generateRefreshToken(findAdmin?.id);
        const updateUser = await user.findByIdAndUpdate(findAdmin?.id, {
            refreshToken: refreshToken
        }, {new: true});
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24*60*60*1000
        });
        res.json({
            _id: findAdmin?._id,
            firstName: findAdmin?.firstName,
            lastName: findAdmin?.lastName,
            email: findAdmin?.email,
            phoneNumber: findAdmin?.phoneNumber,
            token: generateToken(findAdmin?._id)
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

const getWishList = asyncHandler(async (req, res) => {
    const { id } = req.user;
    try {
        const findUser = await user.findById(id).populate('wishList');
        res.json(findUser);
    } catch (error) {
        throw new Error(error);
    }
});

const saveAddress = asyncHandler(async (req, res, next) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
  
    try {
      const updatedUser = await user.findByIdAndUpdate(
        _id,
        {
          address: req?.body?.address,
        },
        {
          new: true,
        }
      );
      res.json(updatedUser);
    } catch (error) {
      throw new Error(error);
    }
  });

const userCart = asyncHandler(async (req, res) => {
    const { cart } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);

    try {
        let products = [];
        const User = await user.findById(_id);
        // check if user already have product in cart
        const alreadyExist = await Cart.findOne({orderby: User._id});
        if (alreadyExist) {
            alreadyExist.remove();
        }
        for (let i=0; i<cart.length; i++) {
            let objects = {};
            objects.product = cart[i]._id;
            objects.count = cart[i].count;
            objects.color = cart[i].color;
            let getPrice = await Product.findById(cart[i]._id).select("price").exec();
            objects.price = getPrice.price;
            products.push(objects);
        }
        let cartTotal = 0;
        for (let i=0; i<products.length; i++) {
            cartTotal = cartTotal + products[i].price*products[i].count;
        }

        let newCart = await new Cart({
            products,
            cartTotal,
            orderby: user?._id
        }).save();
        res.json(newCart);

    } catch (error) {
        throw new Error(error);
    }
});

const getCart = asyncHandler(async (req, res) => {
    const {_id} = req.user;
    validateMongoDbId(_id);
    try {
        const cart = await Cart.findOne({orderby: _id})
            .populate("products.product");
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});

const emptyCart = asyncHandler(async (req, res) => {
    const {_id} = req.user;
    validateMongoDbId(_id);
    try {
        const User = await user.findOne({_id});
        const cart = await Cart.findOneAndRemove({orderby: User._id});
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});

const applyCoupon = asyncHandler(async (req, res) => {
    const { coupon } = req.body;
    const {_id} = req.user;
    validateMongoDbId(_id);
    const validCoupon = await Coupon.findOne({name: coupon});
    if (validCoupon === null) {
        throw new Error('Invalid Coupon!');
    }
    const User = await user.findOne({_id});
    let {cartTotal} = await Cart
        .findOne({orderby: User._id})
        .populate("products.product");
    let totalAfterDiscount = (cartTotal - (cartTotal*validCoupon.discount)/100).toFixed(2);
    await Cart.findOneAndUpdate({orderby: User._id}, {totalAfterDiscount}, {new: true});
    res.json(totalAfterDiscount);
});

const createOrder = asyncHandler(async (req, res) => {
    const {COD, couponApplied} = req.body;
    const {_id} = req.user;
    validateMongoDbId(_id);
    try {
        if (!COD) {
            throw new Error('Create cash order failed');
        }
        const User = await user.findById(_id);
        let userCart = await Cart.findOne({orderby: User._id});
        let finalAmount = 0;
        if (couponApplied && userCart.totalAfterDiscount) {
            finalAmount = userCart.totalAfterDiscount;
        } else {
            finalAmount = userCart.cartTotal;
        }
        let newOrder = await new Order({
            products: userCart.products,
            paymentIntent: {
                id: uniqid(),
                method: "COD",
                amount: finalAmount,
                status: "Cash on Delivery",
                created: Date.now(),
                currency: "VND"
            },
            orderby: User._id,
            orderStatus: 'Cash on Delivery'
        }).save();
        let update = userCart.products.map((item) => {
            return {
                updateOne: {
                    filter: { _id: item.product._id },
                    update: { $inc: { quantity: -item.count, sold: +item.count}}
                }
            }
        });
        const updated = await Product.bulkWrite(update, {});
        res.json({
            message: "Success"
        });
    } catch (error) {
        throw new Error(error);
    }
    
});

const getOrders = asyncHandler(async (req, res) => {
    const {_id} = req.user;
    validateMongoDbId(_id);
    try {
        const userOrders = await Order.findOne({orderby: _id})
                                    .populate("products.product")
                                    .populate("orderby")
                                    .exec();
        if (!userOrders) {
            res.json({
                message: "You have not ordered yet!"
            });
        } else {
            res.json(userOrders);
        }

    } catch (error) {
        throw new Error(error);
    }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const {status} = req.body;
    const {id} = req.params;
    validateMongoDbId(id);
    try {
        const updateOrderStatus = await Order.findByIdAndUpdate(id, {
            orderStatus: status,
            paymentIntent: {
                status: status
            }
        }, { new: true });
        res.json(updateOrderStatus);
    } catch (error) {
        throw new Error(error);
    }
});



module.exports = { createUser, loginUserCotroller, getAllUser, 
    getAUser, deleteAUser, updateAUser, blockUser, unblockUser,
    handleRefreshToken, logout, updatePassword, forgotPasswordToken,
    adminLogin, resetPassword, getWishList, saveAddress, userCart,
    getCart, emptyCart, applyCoupon, createOrder, getOrders, updateOrderStatus}