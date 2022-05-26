const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    userType: {
        type: String,
        required: true
    },
    tenantId: {
        type: String,
        default: ""
    },
    email2: {
        type: String,
        default: ""
    },
    azure: {
        type: Object,
        default: {}
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('users', UserSchema);
