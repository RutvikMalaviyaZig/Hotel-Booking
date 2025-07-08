import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const currency = import.meta.env.VITE_CURRENCY || "$";
    const navigate = useNavigate()
    const { user } = useUser()
    const { getToken } = useAuth()

    const [isOwner, setIsOwner] = useState(false);
    const [showHotelReg, setShowHotelReg] = useState(false);
    const [searchedCities, setSearchedCities] = useState([]);
    const [room, setRoom] = useState([]);

    const fetchRoom = async () => {
        try {
            const { data } = await axios.get('/api/room', {
                headers: {
                    Authorization: `Bearer ${await getToken()}`,
                },
            });
            if (data.success) {
                setRoom(data.rooms);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user', {
                headers: {
                    Authorization: `Bearer ${await getToken()}`,
                },
            });
            if (data.success) {
                setIsOwner(data.role === "owner");
                setSearchedCities(data.recentSearchedCities);
            } else {
                // retry fetchUser
                setTimeout(() => {
                    fetchUser();
                }, 5000);
            }

        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUser();
        };
    }, [user]);

    useEffect(() => {
        fetchRoom();
    }, []);

    const value = {
        currency,
        navigate,
        user,
        getToken,
        isOwner,
        setIsOwner,
        showHotelReg,
        setShowHotelReg,
        axios,
        searchedCities,
        setSearchedCities,
        room,
        setRoom,
    };
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
