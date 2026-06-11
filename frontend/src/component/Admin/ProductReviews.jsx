import React, { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import "./productReviews.css";
import { useSelector, useDispatch } from "react-redux";
import {
  clearErrors,
  getAllReviews,
  deleteReviews,
  deleteReviewReset
} from "../../features/productSlice";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Star from "@mui/icons-material/Star";
import AdminLayout from "./AdminLayout";
import useErrorNotification from "../../hooks/useErrorNotification";

const ProductReviews = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const { error: deleteError, isDeleted } = useSelector(
    (state) => state.product
  );

  const { error, reviews, loading } = useSelector(
    (state) => state.product
  );

  const [productId, setProductId] = useState("");

  // ⚡ Bolt: [performance improvement] Memoize the delete handler to prevent inline function recreation inside columns
  const deleteReviewHandler = useCallback((reviewId) => {
    dispatch(deleteReviews(reviewId, productId));
  }, [dispatch, productId]);

  const productReviewsSubmitHandler = (e) => {
    e.preventDefault();
    dispatch(getAllReviews(productId));
  };

  useErrorNotification(error, clearErrors);
  useErrorNotification(deleteError, clearErrors);

  useEffect(() => {
    if (productId.length === 24) {
      dispatch(getAllReviews(productId));
    }
  }, [dispatch, productId]);

  useEffect(() => {
    if (isDeleted) {
      enqueueSnackbar("Review Deleted Successfully", { variant: "success" });
      navigate("/admin/reviews");
      dispatch(deleteReviewReset());
    }
  }, [dispatch, enqueueSnackbar, navigate, isDeleted]);

  // ⚡ Bolt: [performance improvement] Memoize DataGrid columns to prevent complete remounts and lost UI state (like column resize)
  const columns = useMemo(() => [
    { field: "id", headerName: "Review ID", minWidth: 200, flex: 0.5 },

    {
      field: "user",
      headerName: "User",
      minWidth: 200,
      flex: 0.6,
    },

    {
      field: "comment",
      headerName: "Comment",
      minWidth: 350,
      flex: 1,
    },

    {
      field: "rating",
      headerName: "Rating",
      type: "number",
      minWidth: 180,
      flex: 0.4,

      cellClassName: (params) => {
        return params.row.rating >= 3
          ? "greenColor"
          : "redColor";
      },
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
            <button
              onClick={() =>
                deleteReviewHandler(params.row.id)
              }
              aria-label="Delete review"
            >
              <DeleteIcon />
            </button>
          </Fragment>
        );
      },
    },
  ], [deleteReviewHandler]);

  // ⚡ Bolt: [performance improvement] Memoize rows array construction to prevent O(N) execution on every component render
  const rows = useMemo(() => {
    const rowData = [];
    if (reviews) {
      reviews.forEach((item) => {
        rowData.push({
          id: item._id,
          rating: item.rating,
          comment: item.comment,
          user: item.name,
        });
      });
    }
    return rowData;
  }, [reviews]);

  return (
    <AdminLayout title={`ALL REVIEWS - Admin`}>
      <div className="productReviewsContainer">
        <form
          className="productReviewsForm"
          onSubmit={productReviewsSubmitHandler}
        >
          <h1 className="productReviewsFormHeading">ALL REVIEWS</h1>

          <div>
            <Star />
            <input
              type="text"
              placeholder="Product Id"
              aria-label="Product Id"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </div>

          <button
            id="createProductBtn"
            type="submit"
            className="primary-btn"
            disabled={
              loading ? true : false || productId === "" ? true : false
            }
          >
            Search
          </button>
        </form>

        {reviews && reviews.length > 0 ? (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            disableSelectionOnClick
            className="productListTable"
            autoHeight
          />
        ) : (
          <h1 className="productReviewsFormHeading">No Reviews Found</h1>
        )}
      </div>
    </AdminLayout>
  );
};

export default ProductReviews;
