var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
    id: String,
    email: String,
    password: String,
    institution: String,
    status: String,
    active: Boolean,
    lastLogin : Date,
    creationDate: Date,
    recentFiles: [String],
    numberOfLogin: Number});

