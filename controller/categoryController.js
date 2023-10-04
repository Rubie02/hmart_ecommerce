const Category = require('../models/categoryModel.js');
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId.js");

const createCategory = asyncHandler(async(req, res) => {
    try {
        const newCategory = await Category.create(req.body);
        res.json(newCategory);
    } catch(error) {
        throw new Error(error);
    }
});

const updateCategory = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
            new: true
        });
        res.json(updatedCategory);
    } catch (error) {
        throw new Error(error);
    }
});

const deleteCategory = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const deletedCategory = await Category.findByIdAndDelete(id);
        res.json(deletedCategory);
    } catch (error) {
        throw new Error(error);
    }
});

const getCategory = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getCate = await Category.findById(id);
        res.json(getCate);
    } catch(error) {
        throw new Error(error);
    }
});

const getCategories = asyncHandler(async(req, res) => {
    try {
        const getCates = await Category.find();
        res.json(getCates);
    } catch(error) {
        throw new Error(error);
    }
});

module.exports = {createCategory, updateCategory, deleteCategory, getCategory, getCategories};

