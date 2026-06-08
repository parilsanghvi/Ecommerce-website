import React, { Fragment, useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./ProductDetails.css";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, getProductDetails, newReview, newReviewReset, getAllReviews } from "../../features/productSlice";
import { getTransformedImageUrl } from "../../utils/cloudinary";
import ReviewCard from "./ReviewCard";
import Loader from "../layout/Loader";
import { useSnackbar } from "notistack";
import useErrorNotification from "../../hooks/useErrorNotification";
import MetaData from "../layout/MetaData";
import { addItemsToCart } from "../../features/cartSlice";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Rating, CircularProgress, Tooltip } from "@mui/material";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { product, loading, error } = useSelector((state) => state.product);
  const { success, error: reviewError, reviews, totalReviews, reviewsPage } = useSelector((state) => state.product);

  const NextArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <NavigateNextIcon
        className={`${className} slick-custom-arrow slick-custom-next`}
        style={style}
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
        className={`${className} slick-custom-arrow slick-custom-prev`}
        style={style}
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
  const [reviewsLimit] = useState(5);
  const [addingToCart, setAddingToCart] = useState(false);

  const increaseQuantity = () => {
    if ((product?.stock || 0) <= quantity) return;
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (1 >= quantity) return;
    setQuantity(quantity - 1);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setQuantity("");
      return;
    }
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setQuantity(numValue);
    }
  };

  const handleQuantityBlur = () => {
    let newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 1) {
      newQty = 1;
    }
    const stock = product.stock || 0;
    if (stock > 0 && newQty > stock) {
      newQty = stock;
      enqueueSnackbar(`Only ${stock} items available`, { variant: "info" });
    }
    setQuantity(newQty);
  };

  const addToCartHandler = async () => {
    setAddingToCart(true);
    const resultAction = await dispatch(addItemsToCart({ id, quantity }));
    if (addItemsToCart.fulfilled.match(resultAction)) {
      enqueueSnackbar("Item Added To Cart", { variant: "success" });
    } else {
      enqueueSnackbar("Failed to add to cart", { variant: "error" });
    }
    setAddingToCart(false);
  };

  const submitReviewToggle = () => {
    open ? setOpen(false) : setOpen(true);
  };


  const loadMoreReviews = () => {
    dispatch(getAllReviews({ id: match.params.id, page: reviewsPage + 1, limit: reviewsLimit }));
  };

  const isValidReview = () => rating > 0 && comment.trim().length > 0;

  const buildReviewPayload = () => ({ rating, comment, productId: id });

  const reviewSubmitHandler = () => {
    if (!isValidReview()) {
      enqueueSnackbar("Please provide a rating and a comment", { variant: "error" });
      return;
    }
    dispatch(newReview(buildReviewPayload()));
    setOpen(false);
  };

  useErrorNotification(error, clearErrors);
  useErrorNotification(reviewError, clearErrors);

  useEffect(() => {
    dispatch(getProductDetails(id));
    dispatch(getAllReviews({ id, page: 1, limit: reviewsLimit }));
  }, [dispatch, id, reviewsLimit]);

  useEffect(() => {
    if (success) {
      enqueueSnackbar("Review Submitted Successfully", { variant: "success" });
      dispatch(newReviewReset());
    }
  }, [dispatch, success, enqueueSnackbar]);

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
                          src={getTransformedImageUrl(item.url, { width: 800, height: 800, crop: "fill" })}
                          alt={`${product.name} - View ${i + 1}`}
                          width={600}
                          height={600}
                          loading="lazy"
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
                        loading="lazy"
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
                    <Tooltip title={quantity <= 1 ? "Minimum quantity is 1" : ""}>
                      <button onClick={quantity <= 1 ? undefined : decreaseQuantity} aria-disabled={quantity <= 1} aria-label="Decrease quantity">-</button>
                    </Tooltip>
                    <input
                      type="number"
                      value={quantity}
                      onChange={handleQuantityChange}
                      onBlur={handleQuantityBlur}
                      aria-label="Product quantity"
                    />
                    <Tooltip title={product.stock <= quantity ? "Maximum stock reached" : ""}>
                      <button onClick={product.stock <= quantity ? undefined : increaseQuantity} aria-disabled={product.stock <= quantity} aria-label="Increase quantity">+</button>
                    </Tooltip>
                  </div>
                  <button
                    disabled={product.stock < 1 || addingToCart}
                    onClick={addToCartHandler}
                    aria-busy={addingToCart}
                    aria-label={addingToCart ? "Adding to cart" : "Add to cart"}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    {addingToCart ? <CircularProgress size={20} color="inherit" /> : "ADD TO CART"}
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
            aria-labelledby="submit-review-dialog-title"
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
            <DialogTitle id="submit-review-dialog-title" sx={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 900 }}>Submit Review</DialogTitle>
            <DialogContent className="submitDialog">
              <Rating
                onChange={(e, newValue) => setRating(newValue)}
                value={rating}
                size="large"
                aria-label="Rating"
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
                aria-label="Review comment"
              ></textarea>
            </DialogContent>
            <DialogActions>
              <Button onClick={submitReviewToggle} sx={{ color: 'var(--color-muted)' }}>
                Cancel
              </Button>
              <Button
                onClick={reviewSubmitHandler}
                disabled={rating <= 0 || comment.trim().length === 0}
                sx={{
                  color: (rating <= 0 || comment.trim().length === 0) ? 'var(--color-muted)' : 'var(--color-primary)',
                  fontWeight: 'bold'
                }}
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>

          {reviews && reviews.length > 0 ? (
            <div className="reviews-container">
              <div className="reviews">
                {reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
              {totalReviews > reviews.length && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                  <button className="primary-btn" onClick={loadMoreReviews}>
                    LOAD MORE
                  </button>
                </div>
              )}
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
