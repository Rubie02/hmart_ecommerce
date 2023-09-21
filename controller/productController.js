const Product = require("../models/productModel")
const asyncHandler = require("express-async-handler")
const slugify = require("slugify")


const createProduct = asyncHandler(async(req, res) => {
    try {
        if (req.body.title) {
            req.body.slug=slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch (error) {
        throw new Error(error);
    }
});

const getProduct = asyncHandler(async(req, res) => {
    const { id } = req.params;
    try {
        const findProduct = await Product.findById(id);
        if (!findProduct) {
            res.status(404).json({
                message: "Product not found!"
            });
            return;
        }
        res.json(findProduct);
    } catch (error) {
        throw new Error(error);
    }
}); 

const getAllProduct = asyncHandler(async(req, res) => {
    try {
        const getProducts = await Product.find();
        res.json(getProducts);
    } catch (error) {
        throw new Error(error);
    }
});

const updateProduct = asyncHandler(async(req, res) => {
    const {id} = req.params;
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                message: "Product not found!"
            });
        }
        const updateProductV = await Product.findByIdAndUpdate(
            id,
            req.body,
            {new: true}
        );
        res.json(updateProductV);
    } catch (error) {
        throw new Error(error);
    }
});

const deleteProduct = asyncHandler(async(req, res) => {
    const {id} = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                message: "Product not found!"
            });
        }
        const deleteProductV = await Product.findByIdAndDelete(
            id
        );
        res.json(deleteProductV);
    } catch (error) {
        throw new Error(error);
    }
});


module.exports = { createProduct, getProduct, getAllProduct, updateProduct,
    deleteProduct }