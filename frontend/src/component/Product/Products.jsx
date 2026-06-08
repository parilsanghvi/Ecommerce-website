import React, { Fragment, useEffect } from 'react'
import "./Products.css"
import { useSelector, useDispatch } from 'react-redux'
import { clearErrors, getProduct } from '../../features/productSlice'
import Loader from '../layout/Loader'
import ProductCard from '../Home/ProductCard'
import Pagination from "@mui/material/Pagination"
import Slider from "@mui/material/Slider"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import SearchOffIcon from "@mui/icons-material/SearchOff";
import MetaData from "../layout/MetaData";
import useErrorNotification from "../../hooks/useErrorNotification";
import { motion } from 'framer-motion';
import useProductFilters, { categories, MAX_PRICE } from '../../hooks/useProductFilters';

const Products = () => {
    const dispatch = useDispatch()

    const { products, loading, error, productsCount, resultPerPage, filteredProductsCount } = useSelector((state) => state.product)

    const {
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
    } = useProductFilters();

    const filteredProducts = products || [];

    useErrorNotification(error, clearErrors);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            dispatch(getProduct({ keyword, currentPage, price, category, ratings }));
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [dispatch, keyword, currentPage, price, category, ratings]);

    return (
        <Fragment>
            {loading ? <Loader /> : (
                <Fragment>
                    <MetaData title="PRODUCTS -- ECOMMERCE" />
                    <h2 className='productsHeading'>Inventory</h2>

                    <div className="products-container">
                        <motion.div
                            className='filterBox'
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {isFiltered && (
                                <div className="clear-filters-container">
                                    <Button
                                        variant="text"
                                        color="secondary"
                                        size="small"
                                        onClick={resetFilters}
                                        aria-label="Clear all filters"
                                        sx={{
                                            textTransform: 'none',
                                            padding: '4px 8px',
                                            fontFamily: 'var(--font-heading)',
                                            color: 'var(--color-primary)'
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                            <Typography variant="h6" className="filter-heading" id="range-slider">Price Range</Typography>
                            <Slider
                                // Optimization: Use local state for value to prevent API calls on every drag event
                                value={sliderPrice}
                                onChange={(event, newPrice) => setSliderPrice(newPrice)}
                                onChangeCommitted={priceHandler}
                                valueLabelDisplay='auto'
                                aria-labelledby='range-slider'
                                min={0}
                                max={MAX_PRICE}
                                sx={{
                                    marginTop: '1rem',
                                    marginBottom: '2rem',
                                    color: 'var(--color-primary)',
                                    '& .MuiSlider-thumb': {
                                        borderRadius: '0',
                                        border: '1px solid var(--color-primary)',
                                        backgroundColor: 'var(--color-surface)',
                                        '&:hover': {
                                            boxShadow: '0 0 0 8px rgba(204, 255, 0, 0.16)'
                                        }
                                    },
                                    '& .MuiSlider-track': {
                                        border: 'none',
                                        backgroundColor: 'var(--color-primary)'
                                    },
                                    '& .MuiSlider-rail': {
                                        opacity: 0.5,
                                        backgroundColor: 'var(--color-muted)'
                                    },
                                    '& .MuiSlider-valueLabel': {
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0',
                                        fontFamily: 'var(--font-body)'
                                    }
                                }}
                            />

                            <Typography variant="h6" className="filter-heading">
                                Categories
                            </Typography>
                            <ul className='categoryBox'>
                                {categories.map((cat) => (
                                    <li className='category-link'
                                        key={cat}
                                        onClick={() => {
                                            if (category === cat) {
                                                setCategory("");
                                            } else {
                                                setCategory(cat);
                                            }
                                            setCurrentPage(1);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                if (category === cat) {
                                                    setCategory("");
                                                } else {
                                                    setCategory(cat);
                                                }
                                                setCurrentPage(1);
                                            }
                                        }}
                                        role="button"
                                        aria-label={`Select ${cat} category`}
                                        aria-pressed={category === cat}
                                        tabIndex="0"
                                        style={{ color: category === cat ? 'var(--color-primary)' : 'var(--color-text)' }}
                                    >
                                        {cat}
                                    </li>
                                ))}
                            </ul>

                            <fieldset style={{ border: '1px solid var(--color-border)', padding: '1rem', marginTop: '2rem' }}>
                                <Typography component="legend" variant="caption" style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                    Rating
                                </Typography>
                                <Slider
                                    // Optimization: Use local state for value to prevent API calls on every drag event
                                    value={sliderRatings}
                                    onChange={(e, newRating) => setSliderRatings(newRating)}
                                    onChangeCommitted={(e, newRating) => {
                                        setRating(newRating);
                                        setSliderRatings(newRating); // Ensure sync
                                        setCurrentPage(1);
                                    }}
                                    min={0}
                                    max={5}
                                    valueLabelDisplay='auto'
                                    aria-label="Minimum Rating"
                                    sx={{
                                        marginTop: '0.5rem',
                                        color: 'var(--color-primary)',
                                        '& .MuiSlider-thumb': {
                                            borderRadius: '0',
                                            border: '1px solid var(--color-primary)',
                                            backgroundColor: 'var(--color-surface)'
                                        },
                                        '& .MuiSlider-rail': {
                                            opacity: 0.5,
                                            backgroundColor: 'var(--color-muted)'
                                        },
                                        '& .MuiSlider-valueLabel': {
                                            backgroundColor: 'var(--color-surface)',
                                            color: 'var(--color-text)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '0',
                                            fontFamily: 'var(--font-body)'
                                        }
                                    }}
                                />
                            </fieldset>
                        </motion.div>

                        <div className='products'>
                            {filteredProducts && filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))
                            ) : (
                                <div className="noProducts">
                                    <SearchOffIcon />
                                    <Typography>No Products Found</Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={resetFilters}
                                        sx={{ marginTop: '1rem', fontFamily: 'var(--font-heading)' }}
                                    >
                                        Reset Filters
                                    </Button>
                                </div>
                            )}

                            {resultPerPage < filteredProductsCount && (
                                <div className='paginationBox' style={{ gridColumn: '1 / -1' }}>
                                    <Pagination
                                        count={Math.ceil(filteredProductsCount / resultPerPage)}
                                        page={currentPage}
                                        onChange={setCurrentPageNo}
                                        color="primary"
                                        shape="rounded"
                                        sx={{
                                            '& .MuiPaginationItem-root': {
                                                color: 'var(--color-text)',
                                                fontFamily: 'var(--font-body)',
                                            },
                                            '& .Mui-selected': {
                                                backgroundColor: 'var(--color-primary) !important',
                                                color: 'var(--color-surface) !important',
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Fragment>
            )}
        </Fragment>
    )
}

export default Products
