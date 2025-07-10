import React from 'react'
import HotelCard from './HotelCard'
import Title from './Title'
import { useAppContext } from '../context/AppContext'

const FeaturedDestination = () => {
    const { rooms, navigate } = useAppContext();
    return rooms.length > 0 && (
        <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 py-20'>
            <Title title="Featured Destination" subtitle="Explore the best hotels in the world" />
            <div className='flex flex-wrap gap-6 justify-center items-center mt-20'>
                {
                    rooms.slice(0, 4).map((room, index) => (
                        <HotelCard room={room} index={index} key={room._id} />
                    ))
                }
            </div>
            <button onClick={() => { navigate("/rooms"); scrollTo(0, 0) }} className='mt-16 px-4 py-2 text-sm font-medium border border-gray-300 rounded cursor-pointer transition-all duration-500 hover:bg-gray-50 hover:text-black hover:border-stone-500 hover:shadow-[0px_4px_4px_rgba(0,0,0,0.05)] hover:scale-105 bg-white'>View All Destination</button>
        </div>
    )
}

export default FeaturedDestination