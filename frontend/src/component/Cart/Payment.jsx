import React, { Fragment, useEffect, useRef, useState } from "react";
import CheckoutSteps from "../Cart/CheckoutSteps";
import { useSelector, useDispatch } from "react-redux";
import MetaData from "../layout/MetaData";
import { Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import {
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  removeItemsFromCart
} from "../../features/cartSlice"
import axios from "axios";
import "./payment.css";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EventIcon from "@mui/icons-material/Event";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { createOrder, clearErrors } from "../../features/orderSlice";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const orderInfo = JSON.parse(sessionStorage.getItem("orderInfo"));

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const stripe = useStripe();
  const elements = useElements();
  const payBtn = useRef(null);
  const navigate = useNavigate();

  const { shippingInfo, cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.user);
  const { error } = useSelector((state) => state.order);

  // Detect theme for Stripe Elements styling
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme !== 'light');
    };

    checkTheme();

    // Optional: observe theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  // Dynamic Stripe Element styles based on theme
  const stripeElementStyle = {
    style: {
      base: {
        color: isDarkMode ? '#ffffff' : '#0a0a0a',
        fontSize: '16px',
        fontFamily: '"Space Mono", monospace',
        '::placeholder': {
          color: isDarkMode ? '#888888' : '#666666',
        },
      },
      invalid: {
        color: '#ff3333',
        iconColor: '#ff3333',
      },
    },
  };

  const paymentData = {
    amount: Math.round(orderInfo.totalPrice * 100),
  };

  const order = {
    shippingInfo,
    orderItems: cartItems,
    itemsPrice: orderInfo.subtotal,
    taxPrice: orderInfo.tax,
    shippingPrice: orderInfo.shippingCharges,
    totalPrice: orderInfo.totalPrice,
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    payBtn.current.disabled = true;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/v1/payment/process",
        paymentData,
        config
      );

      const client_secret = data.client_secret;

      if (!stripe || !elements) return;

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: user.name,
            email: user.email,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.pinCode,
              country: shippingInfo.country,
            },
          },
        },
      });

      if (result.error) {
        payBtn.current.disabled = false;

        enqueueSnackbar(result.error.message, { variant: "error" });
      } else {
        if (result.paymentIntent.status === "succeeded") {
          order.paymentInfo = {
            id: result.paymentIntent.id,
            status: result.paymentIntent.status,
          };

          dispatch(createOrder(order));
          for (let i = 0; i < order.orderItems.length; i++) {
            let id = order.orderItems[i].product
            dispatch(removeItemsFromCart(id))
          }
          navigate("/success");
        } else {
          enqueueSnackbar("There's some issue while processing payment ", { variant: "error" });
        }
      }
    } catch (error) {
      payBtn.current.disabled = false;
      enqueueSnackbar(error.response.data.message, { variant: "error" });
    }
  };

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
  }, [dispatch, error, enqueueSnackbar]);

  return (
    <Fragment>
      <MetaData title="Payment" />
      <CheckoutSteps activeStep={2} />
      <div className="paymentContainer">
        <form className="paymentForm" onSubmit={(e) => submitHandler(e)}>
          <Typography className="section-heading">Card Info</Typography>
          <div>
            <CreditCardIcon />
            <CardNumberElement className="paymentInput" options={stripeElementStyle} />
          </div>
          <div>
            <EventIcon />
            <CardExpiryElement className="paymentInput" options={stripeElementStyle} />
          </div>
          <div>
            <VpnKeyIcon />
            <CardCvcElement className="paymentInput" options={stripeElementStyle} />
          </div>

          <input
            type="submit"
            value={`Pay - ₹${orderInfo && orderInfo.totalPrice}`}
            ref={payBtn}
            className="primary-btn paymentFormBtn"
          />
        </form>
      </div>
    </Fragment>
  );
};

export default Payment;

