const { default: mongoose } = require("mongoose")

const db = () => {
    try {
        const connect = mongoose.connect(process.env.database);
        console.log('Database connected.');
    }
    catch (error) {
        console.log('Database error.');
    }
}

module.exports = db;