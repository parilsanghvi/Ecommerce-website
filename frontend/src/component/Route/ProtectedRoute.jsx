import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isAdmin, children }) => {
    const { loading, isAuthenticated, user } = useSelector((state) => state.user);

    if (loading) {
        return null; // or a loader/spinner
    }

    if (isAuthenticated === false) {
        return <Navigate to="/login" />;
    }

    if (isAdmin === true && user?.role !== "admin") {
        return <Navigate to="/account" />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
