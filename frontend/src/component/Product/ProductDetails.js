import React, { Fragment, useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./ProductDetails.css";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, getProductDetails, newReview } from "../../actions/productAction";
import ReviewCard from "./ReviewCard.js";
import Loader from "../layout/Loader";
import { useSnackbar } from "notistack";
import MetaData from "../layout/MetaData";
import { addItemsToCart } from "../../actions/cartAction";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Rating } from "@mui/material";
import { NEW_REVIEW_RESET } from "../../constants/productConstants";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { product, loading, error } = useSelector((state) => state.productDetails);
  const { success, error: reviewError } = useSelector((state) => state.newReview);

  const options = {
    size: "large",
    value: product.ratings,
    readOnly: true,
    precision: 0.5,
  };

  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const increaseQuantity = () => {
    if (product.stock <= quantity) return;
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (1 >= quantity) return;
    setQuantity(quantity - 1);
  };

  const addToCartHandler = () => {
    dispatch(addItemsToCart(id, quantity));
    enqueueSnackbar("Item Added To Cart", { variant: "success" });
  };

  const submitReviewToggle = () => {
    open ? setOpen(false) : setOpen(true);
  };

  const reviewSubmitHandler = () => {
    const myForm = { rating, comment, productId: id };
    dispatch(newReview(myForm));
    setOpen(false);
  };

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
    if (reviewError) {
      enqueueSnackbar(reviewError, { variant: "error" });
      dispatch(clearErrors());
    }
    if (success) {
      enqueueSnackbar("Review Submitted Successfully", { variant: "success" });
      dispatch({ type: NEW_REVIEW_RESET });
    }
    dispatch(getProductDetails(id));
  }, [dispatch, id, error, enqueueSnackbar, reviewError, success]);

  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaData title={`${product.name} -- ECOMMERCE`} />
          <motion.div
            className="ProductDetails"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <div style={{ width: "100%", overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
                  {product.images &&
                    product.images.map((item, i) => (
                      <div key={i}>
                        <img
                          className="CarouselImage"
                          src={item.url}
                          alt={`${product.name} - View ${i + 1}`}
                        />
                      </div>
                    ))}
                </Slider>
              </div>
            </div>

            <div>
              <div className="detailsBlock-1">
                <h2>{product.name}</h2>
                <p>PRODUCT ID: {product._id}</p>
              </div>
              <div className="detailsBlock-2">
                <Rating {...options} sx={{
                    "& .MuiRating-iconFilled": { color: "var(--color-primary)" },
                    "& .MuiRating-iconEmpty": { color: "#333" }
                }} />
                <span className="detailsBlock-2-span">
                  ({product.numOfReviews} REVIEWS)
                </span>
              </div>
              <div className="detailsBlock-3">
                <h1>{`₹${product.price}`}</h1>
                <div className="detailsBlock-3-1">
                  <div className="detailsBlock-3-1-1">
                    <button onClick={decreaseQuantity} disabled={quantity <= 1} aria-label="Decrease quantity">-</button>
                    <input readOnly type="number" value={quantity} aria-label="Product quantity" />
                    <button onClick={increaseQuantity} disabled={product.stock <= quantity} aria-label="Increase quantity">+</button>
                  </div>
                  <button
                    disabled={product.stock < 1 ? true : false}
                    onClick={addToCartHandler}
                  >
                    ADD TO CART
                  </button>
                </div>

                <p style={{fontFamily: 'var(--font-heading)'}}>
                  STATUS:
                  <b className={product.stock < 1 ? "redColor" : "greenColor"} style={{marginLeft: '8px'}}>
                    {product.stock < 1 ? "OUT OF STOCK" : "IN STOCK"}
                  </b>
                </p>
              </div>

              <div className="detailsBlock-4">
                Description : <p>{product.description}</p>
              </div>

              <button onClick={submitReviewToggle} className="submitReview">
                LOG A REVIEW
              </button>
            </div>
          </motion.div>

          <h3 className="reviewsHeading">REVIEWS</h3>

          <Dialog
            aria-labelledby="simple-dialog-title"
            open={open}
            onClose={submitReviewToggle}
            sx={{
              '& .MuiDialog-paper': {
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-text)',
                boxShadow: '8px 8px 0 var(--color-primary)',
                borderRadius: 0,
                color: 'var(--color-text)'
              }
            }}
          >
            <DialogTitle sx={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 900 }}>Submit Review</DialogTitle>
            <DialogContent className="submitDialog">
              <Rating
                onChange={(e, newValue) => setRating(newValue)}
                value={rating}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': { color: 'var(--color-primary)' },
                  '& .MuiRating-iconEmpty': { color: 'var(--color-muted)' }
                }}
              />
              <textarea
                className="submitDialogTextArea"
                cols="30"
                rows="5"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here..."
              ></textarea>
            </DialogContent>
            <DialogActions>
              <Button onClick={submitReviewToggle} sx={{ color: 'var(--color-muted)' }}>
                Cancel
              </Button>
              <Button onClick={reviewSubmitHandler} sx={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                Submit
              </Button>
            </DialogActions>
          </Dialog>

          {product.reviews && product.reviews[0] ? (
            <div className="reviews">
              {product.reviews &&
                product.reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
            </div>
          ) : (
            <p className="noReviews">NO REVIEWS YET</p>
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default ProductDetails;
