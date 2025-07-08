const getUserData = async (req, res) => {
    try {
        const role = req.user.role;
        const recentSearchedCities = req.user.recentSearchedCities;
        res.status(200).json({ success: true, role, recentSearchedCities });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// store recent searched cities
const storeRecentSearchedCities = async (req, res) => {
    try {
        const { recentSearchedCity } = req.body;
        const user = req.user;
        if (user.recentSearchedCities.length < 3) {
            user.recentSearchedCities.push(recentSearchedCity);
        } else {
            user.recentSearchedCities.shift();
            user.recentSearchedCities.push(recentSearchedCity);
        }

        await user.save();
        res.status(200).json({ success: true, message: "Recent searched cities stored successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = {
    getUserData,
    storeRecentSearchedCities
}