import { selectCartItemsArray } from '../../features/cartSlice';
import { API_BASE_URL } from "../../config";
import React, { Fragment, useState, useEffect, useMemo } from "react";
import CheckoutSteps from "../Cart/CheckoutSteps";
import { useSelector } from "react-redux";
import MetaData from "../layout/MetaData";
import "./ConfirmOrder.css";
import { Link, useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";
import axios from "axios";

const ConfirmOrder = () => {
  const { shippingInfo } = useSelector((state) => state.cart);
  const cartItems = useSelector(selectCartItemsArray);
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [pricing, setPricing] = useState({
    tax: 0,
    shippingCharges: 0,
    totalPrice: 0,
  });
  const [loading, setLoading] = useState(false);

  // ⚡ Bolt: [performance improvement] Memoize the subtotal calculation to prevent unnecessary O(N) recalculations on every render
  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
  }, [cartItems]);

  const { tax, shippingCharges, totalPrice } = pricing;

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}/pricing?itemsPrice=${subtotal}`);
        setPricing({
          tax: data.taxPrice,
          shippingCharges: data.shippingPrice,
          totalPrice: data.totalPrice,
        });
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    if (subtotal >= 0) {
      fetchPricing();
    }
  }, [subtotal]);

  const address = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}, ${shippingInfo.pinCode}, ${shippingInfo.country}`;

  const proceedToPayment = () => {
    const data = {
      subtotal,
      shippingCharges,
      tax,
      totalPrice,
    };

    sessionStorage.setItem("orderInfo", JSON.stringify(data));

    navigate("/process/payment");
  };

  return (
    <Fragment>
      <MetaData title="Confirm Order" />
      <CheckoutSteps activeStep={1} />
      <div className="confirmOrderPage">
        <div>
          <div className="confirmshippingArea">
            <Typography className="section-heading">Shipping Info</Typography>
            <div className="confirmshippingAreaBox">
              <div>
                <p>Name:</p>
                <span>{user.name}</span>
              </div>
              <div>
                <p>Phone:</p>
                <span>{shippingInfo.phoneNo}</span>
              </div>
              <div>
                <p>Address:</p>
                <span>{address}</span>
              </div>
            </div>
          </div>
          <div className="confirmCartItems">
            <Typography className="section-heading">Your Cart Items:</Typography>
            <div className="confirmCartItemsContainer">
              {cartItems &&
                cartItems.map((item) => (
                  <div key={item.product}>
                    <img src={item.image} alt={item.name} />
                    <Link to={`/product/${item.product}`}>
                      {item.name}
                    </Link>{" "}
                    <span>
                      {item.quantity} X ₹{item.price} ={" "}
                      <b>₹{item.price * item.quantity}</b>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {/*  */}
        <div>
          <div className="orderSummary">
            <Typography className="section-heading">Order Summary</Typography>
            <div>
              <div>
                <p>Subtotal:</p>
                <span>₹{subtotal}</span>
              </div>
              <div>
                <p>Shipping Charges:</p>
                <span>₹{shippingCharges}</span>
              </div>
              <div>
                <p>GST:</p>
                <span>₹{tax}</span>
              </div>
            </div>

            <div className="orderSummaryTotal">
              <p>
                <b>Total:</b>
              </p>
              <span>₹{totalPrice}</span>
            </div>

            <button className="primary-btn" onClick={proceedToPayment} disabled={loading}>Proceed To Payment</button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default ConfirmOrder;
