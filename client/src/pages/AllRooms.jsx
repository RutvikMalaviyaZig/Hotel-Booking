import React, { useMemo } from 'react'
import { assets, facilityIcons } from '../assets/assets'
import { useSearchParams } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { useState } from 'react'
import { useAppContext } from '../context/AppContext'

const CheckBox = ({ label, selected = false, onChange }) => {
    return (
        <label className='flex gap-3 items-center cursor-pointer text-sm mt-2'>
            <input type="checkbox" checked={selected} onChange={() => onChange(label)} />
            <span className='font-light select-none'>{label}</span>
        </label>
    )
}

const RadioButton = ({ label, selected = false, onChange }) => {
    return (
        <label className='flex gap-3 items-center cursor-pointer text-sm mt-2'>
            <input type="radio" name="shortOption" checked={selected} onChange={(e) => onChange(e.target.checked, label)} />
            <span className='font-light select-none'>{label}</span>
        </label>
    )
}

const AllRooms = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [openFilters, setOpenFilters] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        roomType: [],
        priceRange: [],
    });
    const [selectedSort, setSelectedSort] = useState("");
    const { rooms, navigate, currency } = useAppContext();

    const roomTypes = [
        "Single Bed",
        "Double Bed",
        "Family Room",
        "Luxury Suite"
    ];

    const priceRange = [
        "0 To 100",
        "500 To 1000",
        "1000 To 2000",
        "2000 To 5000",
        "5000 To 10000",
        "10000 To 20000",
    ];

    const shortOptions = [
        "Price Low To High",
        "Price High To Low",
        "Newest First",
        "Oldest First",
    ];

    const handleFilterChange = (checked, value, type) => {
        setSelectedFilters((prevParams) => {
            let updatedFilters = { ...prevParams }
            if (checked) {
                updatedFilters[type].push(value)
            } else {
                updatedFilters[type] = updatedFilters[type].filter((item) => item !== value)
            }
            return updatedFilters
        });
    };

    const handleSortChange = (sortOption) => {
        setSelectedSort(sortOption);
    };

    const matchesRoomType = (room) => {
        return selectedFilters.roomType.length === 0 || selectedFilters.roomType.includes(room.roomType);
    }

    const matchesPriceRange = (room) => {
        return selectedFilters.priceRange.length === 0 || selectedFilters.priceRange.some((priceRange) => {
            const [min, max] = priceRange.split(" To ").map(Number);
            return room.pricePerNight >= min && room.pricePerNight <= max;
        });
    }

    const sortRooms = (a, b) => {
        if (selectedSort === "Price Low To High") {
            return a.pricePerNight - b.pricePerNight;
        } else if (selectedSort === "Price High To Low") {
            return b.pricePerNight - a.pricePerNight;
        } else if (selectedSort === "Newest First") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
            return 0;
        }
    }

    const filterDestinations = (room) => {
        const destination = searchParams.get("destination");
        if (!destination) {
            return true
        }
        return room.hotel.city.toLowerCase().includes(destination.toLowerCase());
    }

    const filteredRooms = useMemo(() => {
        return rooms.filter((room) => filterDestinations(room) && matchesRoomType(room) && matchesPriceRange(room)).sort(sortRooms);
    }, [rooms, selectedFilters, selectedSort, searchParams]);

    const clearFilters = () => {
        setSearchParams({});
        setSelectedSort("");
        setSelectedFilters({
            roomType: [],
            priceRange: [],
        });
    }

    return (
        <div className='flex flex-col-reverse lg:flex-row items-start justify-between pt-28 md:pt-35 px-4 md:px-16 lg:px-24 xl:px-32'>
            <div>
                <div className='flex flex-col items-start text-left'>
                    <h1 className='font-playfair text-4xl md:text-[40px]'>Hotel Rooms</h1>
                    <p className='text-sm md:text-base mt-2 text-gray-500/90 mt-2 max-w-174'>Discover our carefully curated collection of rooms, each designed to provide a unique and memorable experience.</p>
                </div>

                {/* Rooms */}
                {filteredRooms.map((room) => (
                    <div key={room._id} className='flex flex-col md:flex-row items-start gap-6 py-10 border-b border-gray-300 last:pb-30 last:border-0'>
                        <img onClick={() => { navigate(`/rooms/${room._id}`), scrollTo(0, 0) }} src={room.images[0]} alt="hotel-image" title='View Room Details' className='max-h-65 md:w-1/2 rounded-xl shadow-lg object-cover cursor-pointer' />
                        <div className='md:w-1/2 flex flex-col gap-2'>
                            <p className='text-gray-500' >{room.hotel.city}</p>
                            <p onClick={() => { navigate(`/rooms/${room._id}`), scrollTo(0, 0) }} className='font-playfair text-3xl text-gray-800 cursor-pointer'>{room.hotel.name}</p>
                            <div className='flex items-center'>
                                <StarRating rating={room.rating} />
                                <p className='ml-2'>200+ Reviews</p>
                            </div>
                            <div className='flex items-center gap-1 mt-2 text-sm text-gray-500'>
                                <img src={assets.locationIcon} alt="location-icon" />
                                <span>{room.hotel.address}</span>
                            </div>
                            {/* Room Amenities */}
                            <div className='flex flex-wrap items-center gap-4 mt-3 mb-6'>
                                {
                                    room.amenities.map((item, index) => (
                                        <div key={index} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5F5FF]'>
                                            <img src={facilityIcons[item]} alt="amenities-icon" className='w-5 h-5' />
                                            <p className='text-xs'>{item}</p>
                                        </div>
                                    ))
                                }
                            </div>
                            {/* Room Price Per Night */}
                            <p><span className='text-xl text-gray-700 font-medium'>${room.pricePerNight}</span>/night</p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Filters */}
            <div className={`bg-white w-80 border border-gray-300 text-gray-6oo max-lg:mb-8 min-lg:mt-16 rounded-xl `}>
                <div className={`flex items-center justify-between px-5 py-2.5 min-lg:border-b border-gray-300 ${openFilters && "border-b"}`}>
                    <p className='text-base font-medium text-gray-800'>FILTERS</p>
                    <div className='text-xs cursor-pointer'>
                        <span onClick={() => setOpenFilters(!openFilters)} className="block lg:hidden">
                            {openFilters ? 'HIDE' : 'SHOW'}
                        </span>
                        <span className="hidden lg:block" onClick={() => clearFilters()}>CLEAR</span>
                    </div>
                </div>
                <div className={`${openFilters ? 'h-auto' : "h-0 lg:h-auto overflow-hidden transition-all duration-500"}`}>
                    <div className='px-5 pt-5'>
                        <p className='font-medium text-gray-800 pb-2'>Popular Filters</p>
                        {roomTypes.map((room, index) => (
                            <CheckBox key={index} label={room} selected={selectedFilters.roomType.includes(room)} onChange={(checked) => handleFilterChange(checked, room, "roomType")} />
                        ))}
                    </div>
                    <div className='px-5 pt-5'>
                        <p className='font-medium text-gray-800 pb-2'>Price Range</p>
                        {priceRange.map((price, index) => (
                            <CheckBox key={index} label={`${currency}${price}`} selected={selectedFilters.priceRange.includes(price)} onChange={(checked) => handleFilterChange(checked, price, "priceRange")} />
                        ))}
                    </div>
                    <div className='px-5 pt-5 pb-7'>
                        <p className='font-medium text-gray-800 pb-2'>Sort By</p>
                        {shortOptions.map((option, index) => (
                            <RadioButton key={index} label={option} selected={selectedSort === option} onChange={() => handleSortChange(option)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AllRooms