export const getUserData = async (req, res) => {
    try {
        const role = req.user.role;
        const recentSearchedCities = req.user.recentSearchedCities;
        res.json({ success: true, role, recentSearchedCities });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// recent search cities
export const storeRecentSearchedCities = async (req, res) => {
    try {
        const { recentSearchCity } = req.body;
        const user = await req.user;
        if (user.recentSearchedCities.length < 3) {
            user.recentSearchedCities.push(recentSearchCity);
        } else {
            user.recentSearchedCities.shift();
            user.recentSearchedCities.push(recentSearchCity);
        }
        await user.save();
        res.json({ success: true, message: "Recent searched cities stored successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}