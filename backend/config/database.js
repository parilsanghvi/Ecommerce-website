const mongoose = require('mongoose')
// connnects to database 
const connectDatabase = ()=>{
    return mongoose.connect(process.env.DB_URI).then((data) => {
        console.log(`mongodb connected with server: ${data.connection.host}`);
    })
}
module.exports = connectDatabase
