import { User } from "../models/index.js";
import { mongoose, jwt, bcrypt, USER_ROLES, TOKEN_EXPIRY, HTTP_STATUS_CODE, VALIDATION_EVENTS } from "../config/constant.js";
import { validateUser } from "../helpers/validation/UserValidation.js";

export const getUserData = async (req, res) => {
    try {
        // get user data from req.user
        const role = req.user.role;
        // get recent searched cities from req.user
        const recentSearchedCities = req.user.recentSearchedCities;
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, role, recentSearchedCities });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// recent search cities
export const storeRecentSearchedCities = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get recent search city from req.body
        const { recentSearchCity } = req.body;
        const eventCode = VALIDATION_EVENTS.STORE_RECENT_SEARCHED_CITIES;
        // validate recent search city
        const validateRecentSearchCity = validateUser({ recentSearchCity, eventCode });
        if (validateRecentSearchCity.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRecentSearchCity.errors });
        }
        const user = await req.user;
        // check if recent searched cities length is less than 3
        if (user.recentSearchedCities.length < 3) {
            user.recentSearchedCities.push(recentSearchCity);
        } else {
            // remove first element from recent searched cities
            user.recentSearchedCities.shift();
            user.recentSearchedCities.push(recentSearchCity);
        }
        // save user
        await user.save({ session });
        // commit the transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('User.RecentSearchedCitiesStoredSuccessfully') });
    } catch (error) {
        // if anything goes wrong, abort the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// sign up user
export const signUpUser = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // get user data from req.body
        const { name, email, password } = req.body;
        const eventCode = VALIDATION_EVENTS.CREATE_USER;

        // validate user data
        const validateUserData = validateUser({ name, email, password, eventCode });
        if (validateUserData.hasError) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateUserData.errors });
        }

        // check if user already exists
        const existingUser = await User.findOne({ email }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.CONFLICT).json({ success: false, message: req.__('User.UserAlreadyExists') });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // generate user id
        const userId = new mongoose.Types.ObjectId();
        // generate tokens
        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.USER_ACCESS_TOKEN });
        const refreshToken = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.USER_REFRESH_TOKEN });

        // create user within transaction
        await User.create([{
            _id: userId,
            username: name,
            email,
            password: hashedPassword,
            role: USER_ROLES.USER,
            accessToken: token,
            refreshToken
        }], { session });

        // commit the transaction
        await session.commitTransaction();
        session.endSession();

        // send response
        return res.status(HTTP_STATUS_CODE.CREATED).json({
            success: true,
            message: req.__('User.SignUpSuccess'),
            token // token is for only backend use
        });
    } catch (error) {
        // if anything goes wrong, abort the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: req.__('Error.SomethingWentWrong'),
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// sign in user
export const signInUser = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get user data from req.body
        const { email, password } = req.body;
        const eventCode = VALIDATION_EVENTS.SIGN_IN_USER;
        // validate user data
        const validateUserData = validateUser({ email, password, eventCode });
        if (validateUserData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateUserData.errors });
        }
        // check if user exists
        const user = await User.findOne({ email }).session(session);
        if (!user) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ success: false, message: req.__('User.UserNotFound') });
        }
        // check if password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('User.InvalidPassword') });
        }
        // generate token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.USER_ACCESS_TOKEN });
        // generate refresh token
        const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.USER_REFRESH_TOKEN });
        // update user access token and refresh token
        user.accessToken = token;
        user.refreshToken = refreshToken;
        // save user
        await user.save({ session });
        // commit the transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('User.SignInSuccess'), token }); //token is for only backend use
    } catch (error) {
        // if anything goes wrong, abort the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// refresh token
export const refreshToken = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get refresh token from req.body
        const refreshToken = req.headers['authorization'];
        //check if refreshToken starts with Bearer, fetch the token or return error
        if (refreshToken && refreshToken.startsWith('Bearer ')) {
            //if token start with Bearer
            refreshToken = refreshToken.split(' ')[1];
        } else {
            //if token is not provided then send validation response
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
                status: HTTP_STATUS_CODE.UNAUTHORIZED,
                errorCode: '',
                message: req.__('General.RefreshTokenRequired'),
                data: {},
                error: '',
            });
        }

        // check if user exists
        const user = await User.findOne({ refreshToken });
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ success: false, message: req.__('User.UserNotFound') });
        }
        // generate token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.USER_ACCESS_TOKEN })
        user.accessToken = token;
        // save user
        await user.save({ session });
        // commit the transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('User.SignInSuccess'), token }); //token is for only backend use
    } catch (error) {
        // if anything goes wrong, abort the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// sign out user
export const signOutUser = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const eventCode = VALIDATION_EVENTS.SIGN_OUT_USER;
        // validate user
        const validateUserData = validateUser({ userId: req.user._id, eventCode });
        if (validateUserData.hasError) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateUserData.errors });
        }
        // get user from req.user
        const user = await User.findById(req.user._id);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ success: false, message: req.__('User.UserNotFound') });
        }
        // update user access token and refresh token
        user.accessToken = null;
        user.refreshToken = null;
        // save user
        await user.save({ session });
        // commit the transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('User.SignOutSuccess') });
    } catch (error) {
        console.log(error);
        // if anything goes wrong, abort the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// update user
export const updateUser = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get user data from req.body
        const { name, email, password } = req.body;
        const eventCode = VALIDATION_EVENTS.UPDATE_USER;
        // validate user
        const validateUser = validateUser({ name, email, password, eventCode });
        if (validateUser.hasError) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateUser.errors });
        }
        // get user from req.user
        const user = await User.findById(req.user._id);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ success: false, message: req.__('User.UserNotFound') });
        }
        // update user
        user.name = name;
        user.email = email;
        // save user
        await user.save({ session });
        // commit the transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('User.UpdateSuccess') });
    } catch (error) {
        // if anything goes wrong, abort the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

