const mongoose = require('mongoose')
// connnects to database 
const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then((data) => {
        console.log(`mongodb connected with server: ${data.connection.host}, database: ${data.connection.name}`);
    })
}
module.exports = connectDatabase