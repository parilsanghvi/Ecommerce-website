import React, { Fragment, useEffect, useMemo, useCallback, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import "./productList.css";
import { useSelector, useDispatch } from "react-redux";
import {
  clearErrors,
  getAdminProduct,
  deleteProduct,
  deleteProductReset
} from "../../features/productSlice";
import { Link, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminLayout from "./AdminLayout";
import useErrorNotification from "../../hooks/useErrorNotification";

const ProductList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const { error, products } = useSelector((state) => state.product);

  const { error: deleteError, isDeleted } = useSelector(
    (state) => state.product
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const handleDeleteClick = useCallback((id) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  // ⚡ Bolt: [performance improvement] Memoize the delete handler to prevent inline function recreation inside columns
  const deleteProductHandler = useCallback(() => {
    if (productToDelete) {
      dispatch(deleteProduct(productToDelete));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  }, [dispatch, productToDelete]);

  const handleCloseDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  }, []);

  useErrorNotification(error, clearErrors);
  useErrorNotification(deleteError, clearErrors);

  useEffect(() => {
    dispatch(getAdminProduct());
  }, [dispatch]);

  useEffect(() => {
    if (isDeleted) {
      navigate("/admin/dashboard");
      enqueueSnackbar("Product Deleted Successfully", { variant: "success" });
      dispatch(deleteProductReset());
    }
  }, [dispatch, enqueueSnackbar, navigate, isDeleted]);

  // ⚡ Bolt: [performance improvement] Memoize DataGrid columns to prevent complete remounts and lost UI state (like column resize)
  const columns = useMemo(() => [
    { field: "id", headerName: "Product ID", minWidth: 200, flex: 0.5 },

    {
      field: "name",
      headerName: "Name",
      minWidth: 350,
      flex: 1,
    },
    {
      field: "stock",
      headerName: "Stock",
      type: "number",
      minWidth: 150,
      flex: 0.3,
    },

    {
      field: "price",
      headerName: "Price",
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
            <Link to={`/admin/product/${params.row.id}`} aria-label="Edit product">
              <EditIcon />
            </Link>

            <button
              onClick={() =>
                handleDeleteClick(params.row.id)
              }
              aria-label="Delete product"
            >
              <DeleteIcon />
            </button>
          </Fragment>
        );
      },
    },
  ], [deleteProductHandler]);

  // ⚡ Bolt: [performance improvement] Memoize rows array construction to prevent O(N) execution on every component render
  const rows = useMemo(() => {
    const rowData = [];
    if (products) {
      products.forEach((item) => {
        rowData.push({
          id: item._id,
          stock: item.stock,
          price: item.price,
          name: item.name,
        });
      });
    }
    return rowData;
  }, [products]);

  return (
    <AdminLayout title={`ALL PRODUCTS - Admin`}>
      <div className="productListContainer">
        <h1 id="productListHeading">ALL PRODUCTS</h1>

        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          disableSelectionOnClick
          className="productListTable"
          autoHeight
        />
      </div>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-text)',
            boxShadow: '8px 8px 0 var(--color-primary)',
            borderRadius: 0,
            color: 'var(--color-text)'
          }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 900 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description" sx={{ fontFamily: 'var(--font-body)', marginTop: '1rem' }}>
            Are you sure you want to delete this product? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: 'var(--color-muted)' }}>
            Cancel
          </Button>
          <Button
            onClick={deleteProductHandler}
            sx={{
              color: 'var(--color-primary)',
              fontWeight: 'bold'
            }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default ProductList;
