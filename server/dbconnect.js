const mongoose = require('mongoose')
const db = require('../config/db')
mongoose.connect(db.dbname, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
    if (err) {
        log.fatal({msg: '[Mongoose] database connect failed!', err})
    } else {
        console.log('[Mongoose] database connect success!')
    }
})
module.exports = mongoose
