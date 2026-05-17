import React, { useEffect, useMemo } from "react";
import "./dashboard.css";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { Doughnut, Line } from "react-chartjs-2";
import { useSelector, useDispatch } from "react-redux";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { getAdminProduct } from "../../features/productSlice";
import { getAllOrders } from "../../features/orderSlice";
import { getAllUsers } from "../../features/userSlice";
import AdminLayout from "./AdminLayout";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const dispatch = useDispatch();

  const { products } = useSelector((state) => state.product);
  // error
  const { totalAmount = 0, totalOrders } = useSelector((state) => state.order);
  // error
  const { totalUsers } = useSelector((state) => state.user);
  // console.log(orders.length);
  // ⚡ Bolt: [performance improvement] Memoize expensive array calculation to prevent re-running on every render
  const outOfStock = useMemo(() => {
    if (!products) return 0;
    return products.reduce((count, item) => (item.stock === 0 ? count + 1 : count), 0);
  }, [products]);

  useEffect(() => {
    dispatch(getAdminProduct());
    dispatch(getAllOrders({ calculateTotal: true }));
    dispatch(getAllUsers());
  }, [dispatch]);

  const lineState = {
    labels: ["Initial Amount", "Amount Earned"],
    datasets: [
      {
        label: "TOTAL AMOUNT",
        backgroundColor: ["#ccff00"],
        hoverBackgroundColor: ["#00f0ff"],
        borderColor: "#ccff00",
        data: [0, totalAmount],
      },
    ],
  };

  const doughnutState = {
    labels: ["Out of Stock", "InStock"],
    datasets: [
      {
        backgroundColor: ["#ff3333", "#ccff00"],
        hoverBackgroundColor: ["#cc2929", "#a6cc00"],
        data: [outOfStock, products ? products.length - outOfStock : 0],
      },
    ],
  };

  return (
    <AdminLayout title="Dashboard - Admin Panel">
      <Typography component="h1">Dashboard</Typography>

      <div className="dashboardSummary">
        <div>
          <p>
            Total Amount <br /> ₹{totalAmount}
          </p>
        </div>
        <div className="dashboardSummaryBox2">
          <Link to="/admin/products">
            <p>Product</p>
            <p>{products && products.length}</p>
          </Link>
          <Link to="/admin/orders">
            <p>Orders</p>
            <p>{totalOrders && totalOrders}</p>
          </Link>
          <Link to="/admin/users">
            <p>Users</p>
            <p>{totalUsers && totalUsers}</p>
          </Link>
        </div>
      </div>

      <div className="lineChart">
        <Line data={lineState} />
      </div>

      <div className="doughnutChart">
        <Doughnut data={doughnutState} />
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
