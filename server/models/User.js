const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "user",
        enum: ["user", "owner", "admin"]
    },
    image: {
        type: String,
    },
    recentSearchedCities: [{
        type: String,
        required: true
    }],
}, {
    timestamps: true
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
