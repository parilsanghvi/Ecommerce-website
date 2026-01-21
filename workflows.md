# Application Workflows

This document outlines the workflows present in the application, inferred from the frontend routes (`App.js`) and backend API endpoints (`routes/`).

## 1. User Workflows

### Authentication
*   **Registration**: Users can sign up for a new account.
*   **Login**: Users can log in to their existing account.
*   **Logout**: securely end the session.
*   **Forgot Password**: Initiate a password reset process via email.
*   **Reset Password**: Set a new password using the token received in the email.

### Shopping & Discovery
*   **Home/Landing**: View the landing page with featured content.
*   **Browse Products**: View a paginated list of all products.
*   **Search Products**: Search for products by keyword.
*   **View Product Details**: View detailed information, images, and reviews for a specific product (`/product/:id`).
*   **Filtering**: (Inferred from UI) Filter products by category, price, etc.
*   **Reviews**: Write reviews/ratings for products.

### Cart & Checkout
*   **Manage Cart**: Add items to cart, view cart, adjust quantities, and remove items.
*   **Shipping Info**: Enter delivery address and shipping details.
*   **Confirm Order**: Review order summary before payment.
*   **Payment**: Process secure payments via Stripe (`/process/payment`).
*   **Order Success**: View confirmation of a successful order.

### Account Management
*   **Profile**: View user profile information.
*   **Update Profile**: Edit name and email.
*   **Update Password**: Change the account password.
*   **My Orders**: View a history of past orders.
*   **Order Details**: View specific details of a past order (`/order/:id`).

## 2. Admin Workflows (Protected)

These workflows require the user to be logged in with `admin` privileges.

### Dashboard
*   **Overview**: View high-level metrics and analytics (`/admin/dashboard`).

### Product Management
*   **View All Products**: List all products in the system.
*   **Create Product**: Add a new product with details, stock, and images.
*   **Update Product**: Edit existing product details.
*   **Delete Product**: Remove a product from the catalog.

### Order Management
*   **View All Orders**: List all customer orders.
*   **Process Order**: Update order status (e.g., Shipped, Delivered) (`/admin/order/:id`).
*   **Delete Order**: Remove an order record.

### User Management
*   **View All Users**: List all registered users.
*   **Update User**: Change user roles (e.g., promote to admin).
*   **Delete User**: Remove a user account.

### Review Management
*   **Manage Reviews**: View all reviews and delete inappropriate ones (`/admin/reviews`).

## 3. General/Informational
*   **Contact Us**: View contact information/form.
*   **About Us**: View company/project information.
*   **Not Found**: content for 404 errors.
