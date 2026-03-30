import { API_BASE_URL } from "../../config";
import React, { Fragment, useEffect, useRef, useState } from "react";
import CheckoutSteps from "../Cart/CheckoutSteps";
import { useSelector, useDispatch } from "react-redux";
import MetaData from "../layout/MetaData";
import { Typography, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import {
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { removeItemsFromCart } from "../../features/cartSlice";
import axios from "axios";
import "./payment.css";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EventIcon from "@mui/icons-material/Event";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { createOrder, clearErrors } from "../../features/orderSlice";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const orderInfoString = sessionStorage.getItem("orderInfo");
  let orderInfo = {};
  try {
    orderInfo = orderInfoString ? JSON.parse(orderInfoString) : {};
  } catch (e) {
    orderInfo = {};
  }

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const stripe = useStripe();
  const elements = useElements();
  const payBtn = useRef(null);
  const navigate = useNavigate();

  const { shippingInfo, cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.user);
  const { error } = useSelector((state) => state.order);
  const [isProcessing, setIsProcessing] = useState(false);

  // Detect theme for Stripe Elements styling
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDarkMode(theme !== "light");
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const stripeElementStyle = {
    style: {
      base: {
        color: isDarkMode ? "#ffffff" : "#0a0a0a",
        fontSize: "16px",
        fontFamily: '"Space Mono", monospace',
        "::placeholder": {
          color: isDarkMode ? "#888888" : "#666666",
        },
      },
      invalid: {
        color: "#ff3333",
        iconColor: "#ff3333",
      },
    },
  };

  const paymentData = {
    items: cartItems.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    })),
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

    setIsProcessing(true);
    payBtn.current.disabled = true;
    setIsProcessing(true);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.post(
        `${API_BASE_URL}/payment/process`,
        paymentData,
        config
      );

      const client_secret = data.client_secret;

      if (!stripe || !elements) {
        setIsProcessing(false);
        payBtn.current.disabled = false;
        return;
      }

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
        setIsProcessing(false);
        payBtn.current.disabled = false;
        setIsProcessing(false);

        enqueueSnackbar(result.error.message, { variant: "error" });
      } else {
        if (result.paymentIntent.status === "succeeded") {
          order.paymentInfo = {
            id: result.paymentIntent.id,
            status: result.paymentIntent.status,
          };

          dispatch(createOrder(order));
          for (let i = 0; i < order.orderItems.length; i++) {
            let id = order.orderItems[i].product;
            dispatch(removeItemsFromCart(id));
          }
          setIsProcessing(false);
          navigate("/success");
        } else {
          setIsProcessing(false);
          payBtn.current.disabled = false;
          enqueueSnackbar("There's some issue while processing payment ", {
            variant: "error",
          });
        }
      }
    } catch (error) {
      setIsProcessing(false);
      payBtn.current.disabled = false;
      enqueueSnackbar(error.response?.data?.message || "Payment failed", { variant: "error" });
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

          <button
            type="submit"
            ref={payBtn}
            className="primary-btn paymentFormBtn"
            disabled={isProcessing}
            aria-busy={isProcessing}
            style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
          >
            {isProcessing ? (
              <CircularProgress size={24} color="inherit" aria-label="Processing payment" />
            ) : (
              `Pay - ₹${orderInfo && orderInfo.totalPrice ? orderInfo.totalPrice : ""}`
            )}
          </button>
        </form>
      </div>
    </Fragment>
  );
};

export default Payment;
