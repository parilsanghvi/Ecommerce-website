import React, { Fragment, useEffect } from "react";
import "./orderDetails.css";
import { useSelector, useDispatch } from "react-redux";
import MetaData from "../layout/MetaData";
import { Link, useParams } from "react-router-dom";
import { Typography, Tooltip, IconButton } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { getOrderDetails, clearErrors } from "../../features/orderSlice";
import Loader from "../layout/Loader";
import { useSnackbar } from "notistack";

const OrderDetails = () => {
  const { orderDetails: order, error, loading } = useSelector((state) => state.order);

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();

  const copyToClipboard = () => {
    if (order && order._id) {
      navigator.clipboard.writeText(order._id);
      enqueueSnackbar("Order ID Copied!", { variant: "success" });
    }
  };

  useEffect(() => {
    dispatch(getOrderDetails(params.id));
  }, [dispatch, params.id]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
  }, [dispatch, error, enqueueSnackbar]);
  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaData title="Order Details" />
          <div className="orderDetailsPage">
            <div className="orderDetailsContainer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Typography component="h1" className="order-id-heading">
                  Order #{order && order._id}
                </Typography>
                <Tooltip title="Copy Order ID">
                  <IconButton onClick={copyToClipboard} aria-label="Copy Order ID">
                    <ContentCopyIcon color="primary" />
                  </IconButton>
                </Tooltip>
              </div>
              <Typography className="section-heading">Shipping Info</Typography>
              <div className="orderDetailsContainerBox">
                <div>
                  <p>Name:</p>
                  <span>{order.user && order.user.name}</span>
                </div>
                <div>
                  <p>Phone:</p>
                  <span>
                    {order.shippingInfo && order.shippingInfo.phoneNo}
                  </span>
                </div>
                <div>
                  <p>Address:</p>
                  <span>
                    {order.shippingInfo &&
                      `${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state}, ${order.shippingInfo.pinCode}, ${order.shippingInfo.country}`}
                  </span>
                </div>
              </div>
              <Typography className="section-heading">Payment</Typography>
              <div className="orderDetailsContainerBox">
                <div>
                  <div
                    className={
                      order.paymentInfo &&
                        order.paymentInfo.status === "succeeded"
                        ? "greenColor"
                        : "redColor"
                    }
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {order.paymentInfo && order.paymentInfo.status === "succeeded" ? (
                      <CheckCircleIcon aria-hidden="true" />
                    ) : (
                      <ErrorIcon aria-hidden="true" />
                    )}
                    <p className={
                      order.paymentInfo &&
                        order.paymentInfo.status === "succeeded"
                        ? "greenColor"
                        : "redColor"
                    } style={{ margin: 0 }}>
                      {order.paymentInfo &&
                        order.paymentInfo.status === "succeeded"
                        ? "PAID"
                        : "NOT PAID"}
                    </p>
                  </div>
                </div>

                <div>
                  <p>Amount:</p>
                  <span>{order.totalPrice && order.totalPrice}</span>
                </div>
              </div>

              <Typography className="section-heading">Order Status</Typography>
              <div className="orderDetailsContainerBox">
                <div>
                  <div
                    className={
                      order.orderStatus && order.orderStatus === "Delivered"
                        ? "greenColor"
                        : "redColor"
                    }
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {order.orderStatus && order.orderStatus === "Delivered" ? (
                      <CheckCircleIcon aria-hidden="true" />
                    ) : (
                      <ErrorIcon aria-hidden="true" />
                    )}
                    <p className={
                      order.orderStatus && order.orderStatus === "Delivered"
                        ? "greenColor"
                        : "redColor"
                    } style={{ margin: 0 }}>
                      {order.orderStatus && order.orderStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="orderDetailsCartItems">
              <Typography className="section-heading">Order Items:</Typography>
              <div className="orderDetailsCartItemsContainer">
                {order.orderItems &&
                  order.orderItems.map((item) => (
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
        </Fragment>
      )}
    </Fragment>
  );
};

export default OrderDetails;
