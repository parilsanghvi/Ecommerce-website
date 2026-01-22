import React, { Fragment, useState } from "react";
import "./Header.css";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { logout } from "../../../features/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { Menu, MenuItem, Tooltip, IconButton, Avatar, ListItemIcon } from "@mui/material";

const UserOptions = ({ user }) => {
    const { cartItems } = useSelector((state) => state.cart);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const options = [
        { icon: <PersonIcon />, name: "Profile", func: account },
        { icon: <ListAltIcon />, name: "Orders", func: orders },
        {
            icon: (
                <ShoppingCartIcon
                    style={{ color: cartItems.length > 0 ? "var(--color-secondary)" : "unset" }}
                />
            ),
            name: `Cart(${cartItems.length})`,
            func: cart,
        },
        { icon: <ExitToAppIcon />, name: "Logout", func: logoutUser },
    ];

    if (user.role === "admin") {
        options.unshift({
            icon: <DashboardIcon />,
            name: "Dashboard",
            func: dashboard,
        });
    }

    function dashboard() {
        navigate("/admin/dashboard");
        handleClose();
    }

    function account() {
        navigate("/account");
        handleClose();
    }

    function cart() {
        navigate("/cart");
        handleClose();
    }

    function orders() {
        navigate("/orders");
        handleClose();
    }

    function logoutUser() {
        dispatch(logout());
        enqueueSnackbar("Logged out successfully", { variant: "success" });
        navigate("/");
        handleClose();
    }

    return (
        <Fragment>
            <Tooltip title="Account settings">
                <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={open ? "account-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                >
                    <Avatar
                        alt={user.name}
                        src={user.avatar.url ? user.avatar.url : "/Profile.png"}
                        sx={{ width: 40, height: 40 }}
                    />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text)",
                        border: "1px solid var(--color-border)",
                        "& .MuiAvatar-root": {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            backgroundColor: "var(--color-surface)",
                            borderTop: "1px solid var(--color-border)",
                            borderLeft: "1px solid var(--color-border)",
                            transform: "translateY(-50%) rotate(45deg)",
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                {options.map((item) => (
                    <MenuItem
                        key={item.name}
                        onClick={item.func}
                        sx={{
                            color: "var(--color-text)",
                            fontFamily: "var(--font-body)",
                            "&:hover": {
                                backgroundColor: "var(--color-primary)",
                                color: "#000",
                                "& .MuiListItemIcon-root": {
                                    color: "#000"
                                }
                            }
                        }}
                    >
                        <ListItemIcon sx={{ color: "var(--color-primary)" }}>{item.icon}</ListItemIcon>
                        {item.name}
                    </MenuItem>
                ))}
            </Menu>
        </Fragment>
    );
};

export default UserOptions;
