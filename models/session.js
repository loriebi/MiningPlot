var mongoose = require('mongoose');

module.exports = mongoose.model('Session', {
    id : String,
    session : String,
    expires : Date
});