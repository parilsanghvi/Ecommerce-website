import React, { Fragment, useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./ProductDetails.css";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, getProductDetails, newReview, newReviewReset } from "../../features/productSlice";
import ReviewCard from "./ReviewCard";
import Loader from "../layout/Loader";
import { useSnackbar } from "notistack";
import MetaData from "../layout/MetaData";
import { addItemsToCart } from "../../features/cartSlice";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Rating } from "@mui/material";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { product, loading, error } = useSelector((state) => state.product);
  const { success, error: reviewError } = useSelector((state) => state.product);

  const NextArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <NavigateNextIcon
        className={className}
        style={{
          ...style,
          display: "block",
          color: "var(--color-primary)",
          background: "var(--color-surface)",
          borderRadius: "50%",
          border: "1px solid var(--color-text)",
          zIndex: 2,
          width: "40px",
          height: "40px",
          right: "10px"
        }}
        onClick={onClick}
        role="button"
        aria-label="Next Slide"
      />
    );
  }

  const PrevArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <NavigateBeforeIcon
        className={className}
        style={{
          ...style,
          display: "block",
          color: "var(--color-primary)",
          background: "var(--color-surface)",
          borderRadius: "50%",
          border: "1px solid var(--color-text)",
          zIndex: 2,
          width: "40px",
          height: "40px",
          left: "10px"
        }}
        onClick={onClick}
        role="button"
        aria-label="Previous Slide"
      />
    );
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  const options = {
    size: "large",
    value: product?.ratings || 0,
    readOnly: true,
    precision: 0.5,
  };

  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const increaseQuantity = () => {
    if ((product?.stock || 0) <= quantity) return;
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (1 >= quantity) return;
    setQuantity(quantity - 1);
  };

  const addToCartHandler = () => {
    dispatch(addItemsToCart({ id, quantity }));
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
    dispatch(getProductDetails(id));
  }, [dispatch, id]);

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
      dispatch(newReviewReset());
    }
  }, [dispatch, error, reviewError, success, enqueueSnackbar]);

  return (
    <Fragment>
      {loading || !product ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaData title={`${product.name || 'Product'} -- ECOMMERCE`} />
          <motion.div
            className="ProductDetails"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <div style={{ width: "100%", overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
                <Slider {...sliderSettings}>
                  {product.images && product.images.length > 0 ? (
                    product.images.map((item, i) => (
                      <div key={i}>
                        <img
                          className="CarouselImage"
                          src={item.url}
                          alt={`${product.name} - View ${i + 1}`}
                          width={600}
                          height={600}
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <img
                        className="CarouselImage"
                        src="https://via.placeholder.com/600x600?text=No+Image"
                        alt="No Image Available"
                        style={{ objectFit: 'contain', background: '#ccc' }}
                        width={600}
                        height={600}
                      />
                    </div>
                  )}
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

                <p style={{ fontFamily: 'var(--font-heading)' }}>
                  STATUS:
                  <b className={product.stock < 1 ? "redColor" : "greenColor"} style={{ marginLeft: '8px' }}>
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
