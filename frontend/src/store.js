import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";
import productReducer from "./features/productSlice";
import orderReducer from "./features/orderSlice";
import cartReducer from "./features/cartSlice";

const store = configureStore({
    reducer: {
        product: productReducer,
        user: userReducer,
        order: orderReducer,
        cart: cartReducer,
    },
});

export default store;