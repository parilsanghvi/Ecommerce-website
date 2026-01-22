import './App.css';
import "@fontsource/archivo-black";
import "@fontsource/space-mono";
import { useEffect, useState } from "react";
import Header from "./component/layout/Header/Header"
import Footer from "./component/layout/Footer/Footer"
import Loader from "./component/layout/Loader";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React from 'react';
import Home from "./component/Home/Home"
import ProductDetails from "./component/Product/ProductDetails"
import Products from "./component/Product/Products"
import Search from "./component/Product/Search"
import LoginSignup from './component/User/LoginSignUp';
import store from "./store"
import { loadUser } from "./features/userSlice"
import Profile from "./component/User/Profile"
import ProtectedRoute from './component/Route/ProtectedRoute';
import UpdateProfile from './component/User/UpdateProfile'
import UpdatePassword from './component/User/UpdatePassword'
import ForgotPassword from './component/User/ForgotPassword';
import ResetPassword from './component/User/ResetPassword'
import Cart from './component/Cart/Cart'
import Shipping from './component/Cart/Shipping'
import ConfirmOrder from "./component/Cart/ConfirmOrder";
import axios from "axios";
import Payment from "./component/Cart/Payment";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import OrderSuccess from "./component/Cart/OrderSuccess";
import MyOrders from "./component/Order/MyOrders"
import OrderDetails from "./component/Order/OrderDetails"
import Dashboard from "./component/Admin/Dashboard";
import ProductList from "./component/Admin/ProductList";
import NewProduct from "./component/Admin/NewProduct";
import UpdateProduct from "./component/Admin/UpdateProduct";
import OrderList from "./component/Admin/OrderList";
import ProcessOrder from "./component/Admin/ProcessOrder";
import UsersList from "./component/Admin/UsersList";
import UpdateUser from "./component/Admin/UpdateUser";
import ProductReviews from "./component/Admin/ProductReviews";
import Contact from "./component/layout/Contact/Contact";
import About from "./component/layout/About/About";
import NotFound from "./component/layout/Not Found/NotFound";

function App() {

  const [stripeApiKey, setStripeApiKey] = useState("");

  async function getStripeApiKey() {
    try {
      const { data } = await axios.get("/api/v1/stripeapikey");
      setStripeApiKey(data.stripeApiKey);
    } catch (error) {
      console.log("Stripe API key not found or backend unreachable");
    }
  }
  useEffect(() => {
    store.dispatch(loadUser());
    getStripeApiKey();
  }, [])
  // window.addEventListener("contextmenu", (e) => e.preventDefault());
  return (
    <Router>
      <Header />

      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/product/:id" element={<ProductDetails />} />
        <Route exact path="/products" element={<Products />} />
        <Route path="/products/:keyword" element={<Products />} />
        <Route exact path="/search" element={<Search />} />

        <Route element={<ProtectedRoute />}>
          <Route exact path="/account" element={<Profile />} />
          <Route exact path="/me/update" element={<UpdateProfile />} />
          <Route exact path="/password/update" element={<UpdatePassword />} />
          <Route exact path="/shipping" element={<Shipping />} />
          <Route exact path="/success" element={<OrderSuccess />} />
          <Route exact path="/orders" element={<MyOrders />} />
          <Route exact path="/order/confirm" element={<ConfirmOrder />} />
          <Route exact path="/order/:id" element={<OrderDetails />} />
        </Route>

        <Route exact path="/password/forgot" element={<ForgotPassword />} />
        <Route exact path="/password/reset/:token" element={<ResetPassword />} />
        <Route exact path="/contact" element={<Contact />} />
        <Route exact path="/login" element={<LoginSignup />} />
        <Route exact path="/about" element={<About />} />
        <Route exact path="/cart" element={<Cart />} />

        <Route
          path="/process/payment"
          element={
            stripeApiKey ? (
              <Elements stripe={loadStripe(stripeApiKey)}>
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              </Elements>
            ) : (
              <ProtectedRoute>
                <Loader />
              </ProtectedRoute>
            )
          }
        />

        <Route element={<ProtectedRoute isAdmin={true} />}>
          <Route exact path="/admin/dashboard" element={<Dashboard />} />
          <Route exact path="/admin/products" element={<ProductList />} />
          <Route exact path="/admin/product" element={<NewProduct />} />
          <Route exact path="/admin/orders" element={<OrderList />} />
          <Route exact path="/admin/product/:id" element={<UpdateProduct />} />
          <Route exact path="/admin/order/:id" element={<ProcessOrder />} />
          <Route exact path="/admin/users" element={<UsersList />} />
          <Route exact path="/admin/user/:id" element={<UpdateUser />} />
          <Route exact path="/admin/reviews" element={<ProductReviews />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>

  );
}

export default App;
