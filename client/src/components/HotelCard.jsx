import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets.js'

const HotelCard = ({ room, index }) => {
    return (
        <Link to={`/hotel/${room._id}`} key={room._id} onClick={() => scrollTo(0, 0)} className='relative max-w-70 w-full rounded-xl overflow-hidden bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)] hover:scale-105 transition-all duration-500'>

            <img src ={room.images[0]} alt="" />

            {index % 2 === 0 && <p className='px-3 py-1 absolute top-3 left-3 bg-white text-gray-800 font-medium rounded-full text-xs '>Best Seller</p>}

            <div className='p-4 pt-6'>
                <div className='flex items-center justify-between'>
                    <p className='font-medium text-xl font-playfair text-gray-800'>{room.hotel.name}</p>
                    <div className='flex items-center gap-1'>
                        <img src={assets.starIconFilled} alt="star-icon" /> 4.5
                    </div>
                </div>
                <div className='flex items-center gap-1 text-sm'>
                    <img className='mt-1' src={assets.locationFilledIcon} alt="location-icon" />
                    <span className='text-gray-500 mt-1'>{room.hotel.address}</span>
                </div>
                <div className='flex items-center justify-between mt-4 gap-6'>
                    <p><span className='text-xl text-gray-800'>${room.pricePerNight}</span>/night</p>
                    <button className='px-4 py-2 text-sm font-medium border border-gray-300 rounded cursor-pointer transition-all duration-500 hover:bg-gray-50 hover:text-black hover:border-stone-500 hover:shadow-[0px_4px_4px_rgba(0,0,0,0.05)] hover:scale-105'>Book Now</button>
                </div>
            </div>

        </Link>
    )
}

export default HotelCard