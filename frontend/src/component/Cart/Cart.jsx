import React, { Fragment } from "react";
import "./Cart.css";
import CartItemCard from "./CartItemCard";
import { useSelector, useDispatch } from "react-redux";
import { addItemsToCart, removeItemsFromCart } from "../../features/cartSlice";
import { Typography } from "@mui/material";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.cart);

  const increaseQuantity = (id, quantity, stock) => {
    const newQty = quantity + 1;
    if (stock <= quantity) {
      return;
    }
    dispatch(addItemsToCart({ id, quantity: newQty }));
  };

  const decreaseQuantity = (id, quantity) => {
    const newQty = quantity - 1;
    if (1 >= quantity) {
      return;
    }
    dispatch(addItemsToCart({ id, quantity: newQty }));
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
                    <button
                      onClick={() =>
                        decreaseQuantity(item.product, item.quantity)
                      }
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      readOnly
                      aria-label="Product quantity"
                    />
                    <button
                      onClick={() =>
                        increaseQuantity(
                          item.product,
                          item.quantity,
                          item.stock
                        )
                      }
                      disabled={item.stock <= item.quantity}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <p className="cartSubtotal">{`₹${item.price * item.quantity
                    }`}</p>
                </div>
              ))}
          </div>

          <div className="cartFooter">
            <div className="cartGrossProfitBox">
              <p>GROSS TOTAL</p>
              <p>{`₹${cartItems.reduce(
                (acc, item) => acc + item.quantity * item.price,
                0
              )}`}</p>
            </div>
            <button className="primary-btn" onClick={checkoutHandler}>CHECK OUT NOW</button>
          </div>
        </motion.div>
      )}
    </Fragment>
  );
};

export default Cart;
