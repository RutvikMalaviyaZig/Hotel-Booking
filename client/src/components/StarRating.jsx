import React from 'react'
import { assets } from '../assets/assets'

const StarRating = ({ rating }) => {
  return (
    <>
      {Array(5).fill(0).map((_, index) => (
        <img key={index} src={index < rating ? assets.starIconFilled : assets.starIconOutlined} alt="star-icon" />
      ))}
    </>
  )
}

export default StarRating