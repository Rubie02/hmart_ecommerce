const BCategory = require('../models/blogCateModel.js');
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId.js");

const createCategory = asyncHandler(async(req, res) => {
    try {
        const newCategory = await BCategory.create(req.body);
        res.json(newCategory);
    } catch(error) {
        throw new Error(error);
    }
});

const updateCategory = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const updatedCategory = await BCategory.findByIdAndUpdate(id, req.body, {
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
        const deletedCategory = await BCategory.findByIdAndDelete(id);
        res.json(deletedCategory);
    } catch (error) {
        throw new Error(error);
    }
});

const getCategory = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getCate = await BCategory.findById(id);
        res.json(getCate);
    } catch(error) {
        throw new Error(error);
    }
});

const getCategories = asyncHandler(async(req, res) => {
    try {
        const getCates = await BCategory.find();
        res.json(getCates);
    } catch(error) {
        throw new Error(error);
    }
});

module.exports = {createCategory, updateCategory, deleteCategory, getCategory, getCategories};

