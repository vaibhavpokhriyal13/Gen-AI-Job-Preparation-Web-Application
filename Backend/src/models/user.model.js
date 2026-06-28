const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "Username already taken"],
        required: true,
        trim: true,
    },

    email: {
        type: String,
        unique: [true, "Email already registered"],
        required: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
        minlength: [6, "Password must be at least 6 characters"],
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("users", userSchema);