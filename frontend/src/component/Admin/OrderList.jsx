import React, { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import "./productList.css";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Pagination } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminLayout from "./AdminLayout";
import useErrorNotification from "../../hooks/useErrorNotification";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import {
  deleteOrder,
  getAllOrders,
  clearErrors,
  deleteOrderReset,
} from "../../features/orderSlice";

const OrderList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const { error, orders, totalOrders, resultPerPage } = useSelector((state) => state.order);

  const [currentPage, setCurrentPage] = useState(1);

  const { error: deleteError, isDeleted } = useSelector((state) => state.order);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const handleDeleteClick = useCallback((id) => {
    setOrderToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  // ⚡ Bolt: [performance improvement] Memoize the delete handler to prevent inline function recreation inside columns
  const deleteOrderHandler = useCallback(() => {
    if (orderToDelete) {
      dispatch(deleteOrder(orderToDelete));
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  }, [dispatch, orderToDelete]);

  const handleCloseDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  }, []);

  const setCurrentPageNo = (e, value) => {
    setCurrentPage(value);
  };

  useErrorNotification(error, clearErrors);
  useErrorNotification(deleteError, clearErrors);

  useEffect(() => {
    dispatch(getAllOrders(currentPage));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (isDeleted) {
      enqueueSnackbar("Order Deleted Successfully", { variant: "success" });
      navigate("/admin/orders");
      dispatch(deleteOrderReset());
    }
  }, [dispatch, enqueueSnackbar, navigate, isDeleted]);

  // ⚡ Bolt: [performance improvement] Memoize DataGrid columns to prevent complete remounts and lost UI state (like column resize)
  const columns = useMemo(() => [
    { field: "id", headerName: "Order ID", minWidth: 300, flex: 1 },

    {
      field: "status",
      headerName: "Status",
      minWidth: 150,
      flex: 0.5,
      cellClassName: (params) => {
        return params.row.status === "Delivered" ? "greenColor" : "redColor";
      },
    },
    {
      field: "itemsQty",
      headerName: "Items Qty",
      type: "number",
      minWidth: 150,
      flex: 0.4,
    },

    {
      field: "amount",
      headerName: "Amount",
      type: "number",
      minWidth: 270,
      flex: 0.5,
    },

    {
      field: "actions",
      flex: 0.3,
      headerName: "Actions",
      minWidth: 150,
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <Fragment>
            <Link to={`/admin/order/${params.row.id}`} aria-label="Edit order">
              <EditIcon />
            </Link>

            <button onClick={() => handleDeleteClick(params.row.id)} aria-label="Delete order">
              <DeleteIcon />
            </button>
          </Fragment>
        );
      },
    },
  ], [handleDeleteClick]);

  // ⚡ Bolt: [performance improvement] Memoize rows array construction to prevent O(N) execution on every component render
  const rows = useMemo(() => {
    const rowData = [];
    if (orders) {
      orders.forEach((item) => {
        rowData.push({
          id: item._id,
          itemsQty: item.orderItems.length,
          amount: item.totalPrice,
          status: item.orderStatus,
        });
      });
    }
    return rowData;
  }, [orders]);

  return (
    <AdminLayout title={`ALL ORDERS - Admin`}>
      <div className="productListContainer">
        <h1 id="productListHeading">ALL ORDERS</h1>

        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          disableSelectionOnClick
          className="productListTable"
          autoHeight
          hideFooterPagination
        />

        {resultPerPage < totalOrders && (
          <div className="paginationBox">
            <Pagination
              count={Math.ceil(totalOrders / resultPerPage)}
              page={currentPage}
              onChange={setCurrentPageNo}
              color="primary"
            />
          </div>
        )}
      </div>

      <ConfirmDeleteDialog open={deleteDialogOpen} onClose={handleCloseDialog} onConfirm={deleteOrderHandler} itemName="order" />
    </AdminLayout>
  );
};

export default OrderList;
