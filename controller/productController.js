const Product = require("../models/productModel")
const User = require("../models/userModel")
const asyncHandler = require("express-async-handler")
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const axios = require("axios")

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
        //Filtering
        const querObj = {...req.query};
        const exludeFields = ['page', 'sort', 'limit', 'fields'];
        exludeFields.forEach((el) => delete querObj[el]);
        
        let queryString = JSON.stringify(querObj);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        
        let query = Product.find(JSON.parse(queryString));
        //Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort('createdAt');
        }
        //Limiting
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(" ");
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }
        //Pagination
        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page -1) * limit;
        query = query.skip(skip).limit(limit);
        if (req.query.page) {
            const productCount = await Product.countDocuments();
            if (skip>=productCount) throw new Error('This page is not exist!');
        }
        const product = await query;
        res.json(product);
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

const addToWishList = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const {id} = req.body;
    console.log(id);
    try {
      const user = await User.findById(_id);
      const alreadyadded = user.wishList.find((pid) => pid.toString() === id);
      if (alreadyadded) {
        let user = await User.findByIdAndUpdate(
          _id,
          {
            $pull: { wishList: id },
          },
          {
            new: true,
          }
        );
        res.json(user);
      } else {
        let user = await User.findByIdAndUpdate(
          _id,
          {
            $push: { wishList: id },
          },
          {
            new: true,
          }
        );
        res.json(user);
      }
    } catch (error) {
      throw new Error(error);
    }
  });

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, prodId, comment } = req.body;
    try {
        const product = await Product.findById(prodId);
        let alreadyRated = product.ratings.find(
            (userId) => userId.postedby.toString() === _id.toString()
        );
        if (alreadyRated) {
            const updateRating = await Product.updateOne(
                {
                ratings: { $elemMatch: alreadyRated },
                },
                {
                $set: { "ratings.$.star": star, "ratings.$.comment": comment },
                },
                {
                new: true,
                }
        );
        } else {
            const rateProduct = await Product.findByIdAndUpdate(
                prodId,
                {
                $push: {
                    ratings: {
                    star: star,
                    comment: comment,
                    postedby: _id,
                    },
                },
                },
                {
                new: true,
                }
            );
        }
        const getallratings = await Product.findById(prodId);
        let totalRating = getallratings.ratings.length;
        let ratingsum = getallratings.ratings
        .map((item) => item.star)
        .reduce((prev, curr) => prev + curr, 0);
        let actualRating = Math.round(ratingsum / totalRating);
        let finalproduct = await Product.findByIdAndUpdate(
            prodId,
            {
                totalRating: actualRating,
            },
            { new: true }
        );
        res.json(finalproduct);
    } catch (error) {
        throw new Error(error);
    }
});

const getProductRecommenders = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    const findUser = await User.findById(_id);
    if (!findUser) {
        throw new Error("User doesnot exist!");
    }
    try {
        const products_rec = await axios.get(`http://localhost:8888/recommenders/${_id}}`);
        const product_data = products_rec.data;
        console.log(product_data)
        const product_ids = product_data.map(item => item[0]);
        console.log(product_ids)
        if (Array.isArray(product_ids) && product_ids.length > 0) {
            const product = await Product.findById(product_ids);
            if (!product) {
                return res.status(404).json({
                    message: "Products not found!"
                });
            }
            res.json(product);
        } else {
            return res.status(404).json({
                message: "No product recommendations found!"
            });
        }
    } catch (error) {
        res.status(500).json({message: 'Recommenders Internal Server Error'})
    }
});


module.exports = { createProduct, getProduct, getAllProduct, updateProduct,
    deleteProduct, addToWishList, rating, getProductRecommenders }