import React from "react";
import "./CartItemCard.css";
import { Link } from "react-router-dom";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { IconButton, Typography } from "@mui/material";

const CartItemCard = ({ item, deleteCartItems }) => {
  return (
    <div className="CartItemCard">
      <div className="cartItemImage">
        <img src={item.image} alt="ssa" />
      </div>
      <div className="cartItemDetails">
        <Link to={`/product/${item.product}`}>{item.name}</Link>
        <span>{`Price: ₹${item.price}`}</span>

        <button
          className="removeCartBtn"
          onClick={() => deleteCartItems(item.product)}
          aria-label="Remove item"
        >
          <DeleteOutlineIcon fontSize="small" />
          REMOVE
        </button>
      </div>
    </div>
  );
};

export default CartItemCard;
