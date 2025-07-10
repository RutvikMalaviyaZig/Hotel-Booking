import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { assets } from "../assets/assets.js";
import StarRating from "./StarRating";
import { facilityIcons } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { roomCommonData } from "../assets/assets";

const RoomDetails = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const { rooms, getToken, axios, navigate, toast } = useAppContext();
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [isAvailable, setIsAvailable] = useState(false);

  const checkAvailability = async () => {
    try {
      if (checkInDate >= checkOutDate) {
        toast.error("Check-in date must be less than check-out date");
        return;
      }
      const { data } = await axios.post(
        `/api/bookings/check-availability`,
        {
          room: id,
          checkInDate,
          checkOutDate,
        }
      );
      if (data.success) {
        if (data.isAvailable) {
          setIsAvailable(true);
          toast.success("Room is available");
        } else {
          setIsAvailable(false);
          toast.error("Room is not available");
        }
      } else {
        setIsAvailable(false);
        toast.error("Room is not available");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      if (!isAvailable) {
        return checkAvailability();
      } else {
        const { data } = await axios.post(
          `/api/bookings/book`,
          {
            room: id,
            checkInDate,
            checkOutDate,
            guests,
            paymentMethod: "Pay At Hotel",
          },
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        );
        if (data.success) {
          toast.success(data.message);
          navigate(`/my-bookings`);
          window.scrollTo(0, 0);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const room = rooms.find((room) => room._id === id);
    if (room) {
      setRoom(room);
      setMainImage(room.images[0]);
    }
  }, [rooms]);

  useEffect(() => {
    checkAvailability();
  }, [checkInDate, checkOutDate, guests]);

  return (
    room && (
      <div className="py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32">
        {/* Room Details */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
          <h1 className=" text-3xl md:text-4xl font-playfair">
            {room.hotel.name}
            <span className="font-inter text-sm ml-2">({room.roomType})</span>
          </h1>
          <p className="text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full">
            20% OFF
          </p>
        </div>
        {/* Room Rating */}
        <div className="flex items-center gap-1 mt-2">
          <StarRating rating={room.rating} />
          <p className="ml-2">200+ Reviews</p>
        </div>

        {/* Room Address */}
        <div className="flex items-center gap-1 mt-2">
          <img src={assets.locationIcon} alt="location-icon" />
          <p>{room.hotel.address}</p>
        </div>

        {/* Room Images */}
        <div className="flex flex-col lg:flex-row mt-6 gap-6">
          <div className="w-full lg:w-1/2">
            <img
              src={mainImage}
              alt="room-image"
              className="w-full rounded-xl shadow-lg object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:w-1/2 w-full">
            {room?.images.length > 1 &&
              room?.images.map((image, index) => (
                <img
                  onClick={() => setMainImage(image)}
                  className={`w-full rounded-xl shadow-md object-cover cursor-pointer ${mainImage === image && "outline-3 outline-orange-500"
                    }`}
                  key={index}
                  src={image}
                  alt="room-image"
                />
              ))}
          </div>
        </div>

        {/* Room Highlights */}
        <div className="flex flex-col md:flex-row md:justify-between mt-10">
          <div className="flex flex-col ">
            <h1 className="text-3xl md:text-4xl font-playfair">
              Experience Luxury like Never Before
            </h1>
            <div className="flex flex-wrap items-center mt-3 mb-6 gap-4">
              {room.amenities.map((item, index) => (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100"
                  key={index}
                >
                  <img
                    src={facilityIcons[item]}
                    alt={item}
                    className="w-5 h-5"
                  />
                  <p className="text-xs">{item}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Room Price */}
          <p className="text-2xl font-medium">${room.pricePerNight}/night</p>
        </div>

        {/* CheckIn CheckOut Form */}
        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-[0px_0px_20px_rgba(0,0,0,0.15)] mt-16 mx-auto max-w-6xl"
        >
          <div className="flex flex-col gap-4 flex-wrap md:flex-row items-start md:items-center md:gap-10 text-gray-500">
            <div className="flex flex-col">
              <label htmlFor="checkInDate" className="font-medium">
                Check-in
              </label>
              <input
                value={checkInDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckInDate(e.target.value)}
                type="date"
                id="checkInDate"
                placeholder="Check-in"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
              />
            </div>
            <div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>
            <div className="flex flex-col">
              <label htmlFor="checkOutDate" className="font-medium">
                Check-out
              </label>
              <input
                value={checkOutDate}
                min={checkInDate}
                disabled={!checkInDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                type="date"
                id="checkOutDate"
                placeholder="Check-out"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
              />
            </div>
            <div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>
            <div className="flex flex-col">
              <label htmlFor="guests" className="font-medium">
                Guests
              </label>
              <input
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                type="number"
                id="guests"
                placeholder="1"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
                min={1}
                max={10}
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dull active:scale-95 transition-all rounded-md text-white cursor-pointer max-md:w-full max-md:mt-6 md:px-25 py-3 md:py-4 text-base"
          >
            {isAvailable ? "Book Now" : "Check Availability"}
          </button>
        </form>

        {/* Common Specifications */}
        <div className="mt-25 space-y-4">
          {roomCommonData.map((spec, index) => (
            <div key={index} className="flex items-start gap-2">
              <img
                src={spec.icon}
                alt={`${spec.title}-icon`}
                className="w-6.5"
              />
              <div>
                <p className="text-base">{spec.title}</p>
                <p className="text-gray-500">{spec.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-3xl border-y border-gray-300 my-15 py-10 text-gray-500">
          <p>
            Guests will be allocated on the ground floor according to
            availability. You get a comfortable Two bedroom apartment has a true
            city feeling. The price quoted is for two guest, at the guest slot
            please mark the number of guests to get the exact price for groups.
            The Guests will be allocated ground floor according to availability.
            You get the comfortable two bedroom apartment that has a true city
            feeling.
          </p>
        </div>

        {/* Posted By */}
        <div className="flex flex-col items-start gap-4">
          <div className="flex gap-4">
            <img
              src={room.hotel.owner.image}
              alt="Host"
              className="w-14 h-14 rounded-full md:h-18 md:w-18"
            />
            <div>
              <p className="text-lg md:text-xl">
                Hosted by <b>{room.hotel.name}</b>
              </p>
              <div className="flex items-center mt-1">
                <StarRating rating={room.rating} />
                <p className="ml-2">200+ Reviews</p>
              </div>
            </div>
          </div>
          <button className="px-6 py-2.5 mt-4 rounded text-white bg-primary hover:bg-primary-dull transition-all cursor-pointer">
            Contact Now
          </button>
        </div>
      </div>
    )
  );
};

export default RoomDetails;
