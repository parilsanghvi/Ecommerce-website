import './App.css';
import "@fontsource/archivo-black";
import "@fontsource/space-mono";
import { useEffect, useState, Suspense, lazy } from "react";
import Header from "./component/layout/Header/Header"
import Footer from "./component/layout/Footer/Footer"
import Loader from "./component/layout/Loader";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from "./component/Home/Home"
import store from "./store"
import { loadUser } from "./features/userSlice"
import ProtectedRoute from './component/Route/ProtectedRoute';
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import NotFound from "./component/layout/Not Found/NotFound";
import { API_BASE_URL } from "./config";

// Lazy Loaded Components
const ProductDetails = lazy(() => import("./component/Product/ProductDetails"));
const Products = lazy(() => import("./component/Product/Products"));
const Search = lazy(() => import("./component/Product/Search"));
const LoginSignup = lazy(() => import('./component/User/LoginSignup'));
const Profile = lazy(() => import("./component/User/Profile"));
const UpdateProfile = lazy(() => import('./component/User/UpdateProfile'));
const UpdatePassword = lazy(() => import('./component/User/UpdatePassword'));
const ForgotPassword = lazy(() => import('./component/User/ForgotPassword'));
const ResetPassword = lazy(() => import('./component/User/ResetPassword'));
const Cart = lazy(() => import('./component/Cart/Cart'));
const Shipping = lazy(() => import('./component/Cart/Shipping'));
const ConfirmOrder = lazy(() => import("./component/Cart/ConfirmOrder"));
const Payment = lazy(() => import("./component/Cart/Payment"));
const OrderSuccess = lazy(() => import("./component/Cart/OrderSuccess"));
const MyOrders = lazy(() => import("./component/Order/MyOrders"));
const OrderDetails = lazy(() => import("./component/Order/OrderDetails"));
const Dashboard = lazy(() => import("./component/Admin/Dashboard"));
const ProductList = lazy(() => import("./component/Admin/ProductList"));
const NewProduct = lazy(() => import("./component/Admin/NewProduct"));
const UpdateProduct = lazy(() => import("./component/Admin/UpdateProduct"));
const OrderList = lazy(() => import("./component/Admin/OrderList"));
const ProcessOrder = lazy(() => import("./component/Admin/ProcessOrder"));
const UsersList = lazy(() => import("./component/Admin/UsersList"));
const UpdateUser = lazy(() => import("./component/Admin/UpdateUser"));
const ProductReviews = lazy(() => import("./component/Admin/ProductReviews"));
const Contact = lazy(() => import("./component/layout/Contact/Contact"));
const About = lazy(() => import("./component/layout/About/About"));

function App() {

  const [stripePromise, setStripePromise] = useState(null);

  async function getStripeApiKey() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/stripeapikey`);
      setStripePromise(loadStripe(data.stripeApiKey));
    } catch {
      console.log("Stripe API key not found or backend unreachable");
    }
  }
  useEffect(() => {
    store.dispatch(loadUser());
    getStripeApiKey();
  }, [])

  return (
    <Router>
      <Header />
      <Suspense fallback={<Loader />}>
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
              stripePromise ? (
                <Elements stripe={stripePromise}>
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
      </Suspense>
      <Footer />
    </Router>

  );
}

export default App;
