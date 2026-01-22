import React, { Fragment, useEffect } from "react";
import { CgMouse } from "react-icons/cg"
import "./Home.css"
import MetaData from "../layout/MetaData";
import { getProduct, clearErrors } from "../../features/productSlice"
import { useDispatch, useSelector } from "react-redux"
import Loader from "../layout/Loader";
import { useSnackbar } from "notistack";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";

const Home = () => {
    const { enqueueSnackbar } = useSnackbar();
    const dispatch = useDispatch();
    const { loading, error, products } = useSelector((state) => state.product)

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        dispatch(getProduct())
    }, [dispatch, error, enqueueSnackbar])

    return (<Fragment>
        {loading ? (<Loader />) : (<Fragment>
            <MetaData title="ECOMMERCE | FUTURE READY" />

            <motion.div
                className="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <motion.p
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Welcome to the Future
                </motion.p>

                <motion.h1
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                >
                    FIND AMAZING<br />PRODUCTS BELOW
                </motion.h1>

                <a href="#container" style={{ textDecoration: 'none', marginTop: '32px' }}>
                    <motion.button
                        className="scroll-btn"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        Scroll <CgMouse />
                    </motion.button>
                </a>
            </motion.div>

            <h2 className="homeHeading">Featured Drops</h2>

            <div className="container" id="container">
                {products && products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))
                ) : (
                    <p style={{ color: 'white' }}>No products found</p>
                )}
            </div>
        </Fragment>
        )}
    </Fragment>
    );
};

export default Home;
