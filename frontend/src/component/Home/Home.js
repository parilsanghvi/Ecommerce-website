import React, { Fragment, useEffect } from "react";
import { CgMouse } from "react-icons/cg"
import "./Home.css"
import MetaData from "../layout/MetaData";
import { getProduct, clearErrors } from "../../actions/productAction"
import { useDispatch, useSelector } from "react-redux"
import Loader from "../layout/Loader";
import { useSnackbar } from "notistack";
import ProductCard from "./ProductCard.js";

const Home = () => {
    const { enqueueSnackbar } = useSnackbar();

    const dispatch = useDispatch();
    const { loading, error, products } = useSelector((state) => state.products)
    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        dispatch(getProduct())
    }, [dispatch, error, enqueueSnackbar])
    return (<Fragment>
        {loading ? (<Loader />) : (<Fragment>
            <MetaData title="ECOMMERCE" />
            <div className="banner">
                <p>Welcome to Ecommerce</p>
                <h1>FIND AMAZING PRODUCTS BELOW</h1>
                <a href="#container">
                    <button>
                        Scroll<CgMouse />
                    </button>
                </a>
            </div>
            <h2 className="homeHeading">Featured Products</h2>
            <div className="container" id="container">
                {products && products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))
                ) : (
                    <p>No products found (Length: {products ? products.length : "null"})</p>
                )}
            </div>
        </Fragment>
        )}
    </Fragment>
    );
};

export default Home;
