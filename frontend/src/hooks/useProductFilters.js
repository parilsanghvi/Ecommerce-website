import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const MAX_PRICE = 25000;

export const categories = [
    "Laptop",
    "Footwear",
    "Bottom",
    "Tops",
    "Attire",
    "Camera",
    "SmartPhones",
];

const useProductFilters = () => {
    const [ratings, setRating] = useState(0);
    const [sliderRatings, setSliderRatings] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [price, setPrice] = useState([0, MAX_PRICE]);
    const [sliderPrice, setSliderPrice] = useState([0, MAX_PRICE]);
    const [category, setCategory] = useState("");

    const navigate = useNavigate();
    const { keyword } = useParams();

    const setCurrentPageNo = (e, value) => {
        setCurrentPage(value);
    };

    const priceHandler = (event, newPrice) => {
        setPrice(newPrice);
        setSliderPrice(newPrice);
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setPrice([0, MAX_PRICE]);
        setSliderPrice([0, MAX_PRICE]);
        setCategory("");
        setRating(0);
        setSliderRatings(0);
        setCurrentPage(1);
        if (keyword) {
            navigate('/products');
        }
    };

    const isFiltered = price[0] !== 0 || price[1] !== MAX_PRICE || category !== "" || ratings > 0;

    return {
        ratings, setRating,
        sliderRatings, setSliderRatings,
        currentPage, setCurrentPage,
        price, setPrice,
        sliderPrice, setSliderPrice,
        category, setCategory,
        keyword,
        setCurrentPageNo,
        priceHandler,
        resetFilters,
        isFiltered,
    };
};

export default useProductFilters;
