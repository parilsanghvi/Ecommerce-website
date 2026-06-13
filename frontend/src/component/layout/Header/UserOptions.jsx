import { selectCartItemsArray } from '../../../features/cartSlice';
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

const menuPaperProps = {
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
};

const menuItemStyles = {
    color: "var(--color-text)",
    fontFamily: "var(--font-body)",
    "&:hover": {
        backgroundColor: "var(--color-primary)",
        color: "#000",
        "& .MuiListItemIcon-root": {
            color: "#000"
        }
    }
};

const UserOptions = ({ user }) => {
    const cartItems = useSelector(selectCartItemsArray);

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

    const navigateTo = (path) => {
        navigate(path);
        handleClose();
    };

    const logoutUser = () => {
        dispatch(logout());
        enqueueSnackbar("Logged out successfully", { variant: "success" });
        navigate("/");
        handleClose();
    };

    const options = [
        { icon: <PersonIcon />, name: "Profile", func: () => navigateTo("/account") },
        { icon: <ListAltIcon />, name: "Orders", func: () => navigateTo("/orders") },
        {
            icon: (
                <ShoppingCartIcon
                    style={{ color: cartItems.length > 0 ? "var(--color-secondary)" : "unset" }}
                />
            ),
            name: `Cart(${cartItems.length})`,
            func: () => navigateTo("/cart"),
        },
        { icon: <ExitToAppIcon />, name: "Logout", func: logoutUser },
    ];

    if (user.role === "admin") {
        options.unshift({
            icon: <DashboardIcon />,
            name: "Dashboard",
            func: () => navigateTo("/admin/dashboard"),
        });
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
                    aria-label="Account settings"
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
                PaperProps={menuPaperProps}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                {options.map((item) => (
                    <MenuItem
                        key={item.name}
                        onClick={item.func}
                        sx={menuItemStyles}
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
