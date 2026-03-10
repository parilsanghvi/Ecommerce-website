import React, { Fragment } from "react";
import "./Cart.css";
import CartItemCard from "./CartItemCard";
import { useSelector, useDispatch } from "react-redux";
import { addItemsToCart, removeItemsFromCart } from "../../features/cartSlice";
import { Typography, Tooltip, CircularProgress } from "@mui/material";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.cart);
  const [updatingItems, setUpdatingItems] = useState({});

  // ⚡ Bolt: Memoize expensive array calculation to prevent re-running on every render (e.g., when updating item quantity)
  const grossTotal = useMemo(() => cartItems.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  ), [cartItems]);

  const increaseQuantity = async (id, quantity, stock) => {
    const newQty = quantity + 1;
    if (stock <= quantity) {
      return;
    }
    setUpdatingItems((prev) => ({ ...prev, [id]: "increase" }));
    try {
      await dispatch(addItemsToCart({ id, quantity: newQty }));
    } finally {
      setUpdatingItems((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const decreaseQuantity = async (id, quantity) => {
    const newQty = quantity - 1;
    if (1 >= quantity) {
      return;
    }
    setUpdatingItems((prev) => ({ ...prev, [id]: "decrease" }));
    try {
      await dispatch(addItemsToCart({ id, quantity: newQty }));
    } finally {
      setUpdatingItems((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const deleteCartItems = (id) => {
    dispatch(removeItemsFromCart(id));
  };

  const checkoutHandler = () => {
    navigate("/login?redirect=/shipping");
  };

  return (
    <Fragment>
      {cartItems.length === 0 ? (
        <div className="emptyCart">
          <RemoveShoppingCartIcon />

          <Typography variant="h5">YOUR CART IS EMPTY</Typography>
          <Link to="/products">GO SHOPPING</Link>
        </div>
      ) : (
        <motion.div
          className="cartPage"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cartHeader">
            <p>Product</p>
            <p>Quantity</p>
            <p>Subtotal</p>
          </div>

          <div className="cartItemsContainer">
            {cartItems &&
              cartItems.map((item) => (
                <div className="cartContainer" key={item.product}>
                  <CartItemCard item={item} deleteCartItems={deleteCartItems} />
                  <div className="cartInput">
                    <Tooltip title={item.quantity <= 1 ? "Minimum quantity is 1" : ""}>
                      <button
                        onClick={() =>
                          decreaseQuantity(item.product, item.quantity)
                        }
                        disabled={!!updatingItems[item.product]}
                        aria-disabled={item.quantity <= 1 || !!updatingItems[item.product]}
                        aria-label="Decrease quantity"
                      >
                        {updatingItems[item.product] === "decrease" ? (
                          <CircularProgress size={20} sx={{ color: 'var(--color-primary)' }} />
                        ) : (
                          "-"
                        )}
                      </button>
                    </Tooltip>
                    <input
                      type="number"
                      value={item.quantity}
                      readOnly
                      aria-label="Product quantity"
                      aria-busy={!!updatingItems[item.product]}
                    />
                    <Tooltip title={item.stock <= item.quantity ? "Maximum stock reached" : ""}>
                      <button
                        onClick={() =>
                          increaseQuantity(
                            item.product,
                            item.quantity,
                            item.stock
                          )
                        }
                        disabled={!!updatingItems[item.product]}
                        aria-disabled={item.stock <= item.quantity || !!updatingItems[item.product]}
                        aria-label="Increase quantity"
                      >
                        {updatingItems[item.product] === "increase" ? (
                          <CircularProgress size={20} sx={{ color: 'var(--color-primary)' }} />
                        ) : (
                          "+"
                        )}
                      </button>
                    </Tooltip>
                  </div>
                  <p className="cartSubtotal">{`₹${item.price * item.quantity
                    }`}</p>
                </div>
              ))}
          </div>

          <div className="cartFooter">
            <div className="cartGrossProfitBox">
              <p>GROSS TOTAL</p>
              <p>{`₹${grossTotal}`}</p>
            </div>
            <button className="primary-btn" onClick={checkoutHandler}>CHECK OUT NOW</button>
          </div>
        </motion.div>
      )}
    </Fragment>
  );
};

export default Cart;
