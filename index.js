const express = require("express");
const db = require("./config/db");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 4000;
const authRouter = require('./routes/authRoute');
const productRouter = require('./routes/productRoute');
const blogRouter = require("./routes/blogRoute");
const categoryRouter = require("./routes/categoryRoute");
const blogCateRouter = require("./routes/blogCateRoute");
const brandRouter = require("./routes/brandRoute");
const couponRouter = require("./routes/couponRoute");
const colorRouter = require("./routes/colorRoute");
const enqRouter = require("./routes/enqRoute");
const bodyParser = require("body-parser");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const morgan = require("morgan")
db();

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use('/api/users', authRouter);
app.use('/api/products', productRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/blog-categories', blogCateRouter);
app.use('/api/brands', brandRouter);
app.use('/api/coupons', couponRouter);
app.use('/api/colors', colorRouter);
app.use('/api/enquiries', enqRouter);

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}.`);
});