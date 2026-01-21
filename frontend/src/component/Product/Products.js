import React, { Fragment, useEffect, useState, useMemo } from 'react'
import "./Products.css"
import { useSelector, useDispatch } from 'react-redux'
import { clearErrors, getProduct } from '../../actions/productAction'
import Loader from '../layout/Loader'
import ProductCard from '../Home/ProductCard'
import Pagination from "@mui/material/Pagination"
import Slider from "@mui/material/Slider"
import Typography from "@mui/material/Typography"
import SearchOffIcon from "@mui/icons-material/SearchOff";
import MetaData from "../layout/MetaData";
import { useSnackbar } from "notistack";
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const categories = [
    "Laptop",
    "Footwear",
    "Bottom",
    "Tops",
    "Attire",
    "Camera",
    "SmartPhones",
]

const Products = () => {
    const dispatch = useDispatch()
    const { enqueueSnackbar } = useSnackbar();
    const [ratings, setRating] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [price, setPrice] = useState([0, 25000])
    const [category, setCategory] = useState("")
    const { products, loading, error, productsCount, resultPerPage } = useSelector((state) => state.products)
    const { keyword } = useParams();

    const setCurrentPageNo = (e, value) => {
        setCurrentPage(value)
    }
    const priceHandler = (event, newPrice) => {
        setPrice(newPrice);
    }

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter((product) => product.stock !== 0);
    }, [products]);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        dispatch(getProduct(keyword, currentPage, price, category, ratings))
    }, [dispatch, keyword, currentPage, price, category, ratings, enqueueSnackbar, error])

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
                            <Typography style={{fontFamily: 'var(--font-heading)', textTransform: 'uppercase'}}>Price Range</Typography>
                            <Slider
                                value={price}
                                onChange={priceHandler}
                                valueLabelDisplay='auto'
                                aria-labelledby='range-slider'
                                min={0}
                                max={25000}
                                sx={{
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

                            <Typography style={{fontFamily: 'var(--font-heading)', textTransform: 'uppercase', marginTop: '24px'}}>
                                Categories
                            </Typography>
                            <ul className='categoryBox'>
                                {categories.map((cat) => (
                                    <li className='category-link'
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        tabIndex="0"
                                        style={{ color: category === cat ? 'var(--color-primary)' : '' }}
                                    >
                                        {cat}
                                    </li>
                                ))}
                            </ul>

                            <fieldset style={{border: '1px solid var(--color-border)', padding: '1rem', marginTop: '1rem'}}>
                                <Typography component="legend" style={{fontFamily: 'var(--font-heading)', textTransform: 'uppercase'}}>
                                    Rating
                                </Typography>
                                <Slider
                                    value={ratings}
                                    onChange={(e, newRating) => {
                                        setRating(newRating)
                                    }}
                                    min={0}
                                    max={5}
                                    valueLabelDisplay='auto'
                                    sx={{
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
                                </div>
                            )}

                            <div className='paginationBox' style={{ gridColumn: '1 / -1' }}>
                                <Pagination
                                    count={Math.ceil(productsCount / resultPerPage)}
                                    page={currentPage}
                                    onChange={setCurrentPageNo}
                                    color="primary"
                                    shape="rounded"
                                />
                            </div>
                        </div>
                    </div>
                </Fragment>
            )}
        </Fragment>
    )
}

export default Products
