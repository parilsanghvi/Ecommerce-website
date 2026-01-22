import React, { Fragment, useEffect, useState } from "react";
import MetaData from "../layout/MetaData";
import { Link, useParams } from "react-router-dom";
import { Typography } from "@mui/material";
import SideBar from "./Sidebar";
import {
  getOrderDetails,
  clearErrors,
  updateOrder,
  updateOrderReset,
} from "../../features/orderSlice";
import { useSelector, useDispatch } from "react-redux";
import Loader from "../layout/Loader";
import { useSnackbar } from "notistack";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { Button } from "@mui/material";
import "./processOrder.css";

const ProcessOrder = () => {
  const { orderDetails: order, error, loading } = useSelector((state) => state.order);
  const { error: updateError, isUpdated } = useSelector((state) => state.order);
  const params = useParams();

  const updateOrderSubmitHandler = (e) => {
    e.preventDefault();

    const myForm = new FormData();

    myForm.set("status", status);

    dispatch(updateOrder({ id: params.id, orderData: myForm }));
  };

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [status, setStatus] = useState("");

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
    if (updateError) {
      enqueueSnackbar(updateError, { variant: "error" });
      dispatch(clearErrors());
    }
    if (isUpdated) {
      enqueueSnackbar("Order Updated Successfully", { variant: "success" });
      dispatch(updateOrderReset());
    }

    dispatch(getOrderDetails(params.id));
  }, [dispatch, enqueueSnackbar, error, params.id, isUpdated, updateError]);

  return (
    <Fragment>
      <MetaData title="Process Order" />
      <div className="dashboard">
        <SideBar />
        <div className="processOrderContainer" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: order.orderStatus === "Delivered" ? "1fr" : "2fr 1fr", gap: "2rem" }}>
          {loading ? (
            <Loader />
          ) : (
            <Fragment>
              <div
                className="confirmOrderPage"
                style={{
                  display: "block",
                  border: "2px solid var(--color-text)",
                  backgroundColor: "var(--color-surface)",
                  padding: "2rem",
                  boxShadow: "8px 8px 0 var(--color-primary)"
                }}
              >
                <div className="confirmshippingArea">
                  <Typography component="h2" className="order-id-heading" style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--color-text)', paddingBottom: '1rem', marginBottom: '2rem' }}>SHIPPING INFO</Typography>
                  <div className="orderDetailsContainerBox">
                    <div style={{ display: 'flex', marginBottom: '1rem' }}>
                      <p style={{ fontWeight: '900', width: '100px' }}>Name:</p>
                      <span>{order.user && order.user.name}</span>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '1rem' }}>
                      <p style={{ fontWeight: '900', width: '100px' }}>Phone:</p>
                      <span>
                        {order.shippingInfo && order.shippingInfo.phoneNo}
                      </span>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '1rem' }}>
                      <p style={{ fontWeight: '900', width: '100px' }}>Address:</p>
                      <span>
                        {order.shippingInfo &&
                          `${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state}, ${order.shippingInfo.pinCode}, ${order.shippingInfo.country}`}
                      </span>
                    </div>
                  </div>

                  <Typography component="h2" className="order-id-heading" style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--color-text)', paddingBottom: '1rem', marginBottom: '2rem', marginTop: '3rem' }}>PAYMENT</Typography>
                  <div className="orderDetailsContainerBox">
                    <div style={{ display: 'flex', marginBottom: '1rem' }}>
                      <p
                        className={
                          order.paymentInfo &&
                            order.paymentInfo.status === "succeeded"
                            ? "greenColor"
                            : "redColor"
                        }
                        style={{ fontWeight: '900', textTransform: 'uppercase' }}
                      >
                        {order.paymentInfo &&
                          order.paymentInfo.status === "succeeded"
                          ? "PAID"
                          : "NOT PAID"}
                      </p>
                    </div>

                    <div style={{ display: 'flex', marginBottom: '1rem' }}>
                      <p style={{ fontWeight: '900', width: '100px' }}>Amount:</p>
                      <span>{order.totalPrice && order.totalPrice}</span>
                    </div>
                  </div>

                  <Typography component="h2" className="order-id-heading" style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--color-text)', paddingBottom: '1rem', marginBottom: '2rem', marginTop: '3rem' }}>ORDER STATUS</Typography>
                  <div className="orderDetailsContainerBox">
                    <div>
                      <p
                        className={
                          order.orderStatus && order.orderStatus === "Delivered"
                            ? "greenColor"
                            : "redColor"
                        }
                        style={{ fontWeight: '900', textTransform: 'uppercase' }}
                      >
                        {order.orderStatus && order.orderStatus}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="confirmCartItems" style={{ marginTop: '3rem', borderTop: '2px solid var(--color-border)', paddingTop: '2rem' }}>
                  <Typography component="h2" className="order-id-heading" style={{ fontSize: '1.5rem' }}>YOUR CART ITEMS:</Typography>
                  <div className="confirmCartItemsContainer">
                    {order.orderItems &&
                      order.orderItems.map((item) => (
                        <div key={item.product} style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src={item.image} alt="Product" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                            <Link to={`/product/${item.product}`} style={{ fontWeight: '700' }}>
                              {item.name}
                            </Link>
                          </div>
                          <span>
                            {item.quantity} X ₹{item.price} ={" "}
                            <b>₹{item.price * item.quantity}</b>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Process Order Form */}
              <div
                style={{
                  display: order.orderStatus === "Delivered" ? "none" : "block",
                }}
              >
                <form
                  className="updateOrderForm"
                  onSubmit={updateOrderSubmitHandler}
                  style={{
                    padding: "2rem",
                    backgroundColor: "var(--color-surface)",
                    border: "2px solid var(--color-text)",
                    boxShadow: "8px 8px 0 var(--color-primary)",
                    height: 'fit-content'
                  }}
                >
                  <h1 className="section-heading" style={{ borderBottom: 'none', marginBottom: '1rem' }}>Process Order</h1>

                  <div style={{ marginBottom: '2rem' }}>
                    <AccountTreeIcon style={{ position: 'absolute', margin: '1rem', color: 'var(--color-text)' }} />
                    <select
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ paddingLeft: '3rem', width: '100%' }}
                    >
                      <option value="">Choose Category</option>
                      {order.orderStatus === "processing" && (
                        <option value="Shipped">Shipped</option>
                      )}

                      {order.orderStatus === "Shipped" && (
                        <option value="Delivered">Delivered</option>
                      )}
                    </select>
                  </div>

                  <button
                    id="createProductBtn"
                    type="submit"
                    className="primary-btn"
                    disabled={
                      loading ? true : false || status === "" ? true : false
                    }
                  >
                    Process
                  </button>
                </form>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default ProcessOrder;
