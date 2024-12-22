const mongoose = require('mongoose')
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`Database connected at ${conn.connection.host}`)
    } catch (error) {
        console.log(error)
    }
}
module.exports = connectDB;