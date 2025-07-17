import { mongoose } from "../config/constant.js";

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: mongoose.Types.ObjectId,
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    role: {
        type: String,
        enum: ["user", "hotelOwner"],
        default: "user",
    },
    recentSearchedCities: {
        type: [{ type: String }],
    },
    refreshToken: {
        type: String,
    },
    accessToken: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

const User = mongoose.model("User", userSchema);

export default User;
