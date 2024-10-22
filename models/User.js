const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;