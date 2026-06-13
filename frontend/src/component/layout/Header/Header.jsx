import { selectCartItemsArray } from '../../../features/cartSlice';
import React, { useState, useEffect } from 'react';
import { Box, Container, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Tooltip, Badge } from '@mui/material';
import { motion } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserOptions from "./UserOptions";
import { useSelector } from 'react-redux';
import "./Header.css";

const Header = () => {
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const cartItems = useSelector(selectCartItemsArray);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
    };

    const navLinks = [
        { text: 'Home', path: '/' },
        { text: 'Products', path: '/products' },
        { text: 'Contact', path: '/contact' },
        { text: 'About', path: '/about' },
    ];

    const renderDrawer = () => (
        <Box
            sx={{ width: 250, backgroundColor: 'var(--color-bg)', height: '100%', color: 'var(--color-text)', borderRight: '1px solid var(--color-primary)' }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                {navLinks.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={isActive}
                                sx={{
                                    '&:hover': { backgroundColor: 'var(--color-primary)', color: 'black' },
                                    '&.Mui-selected': {
                                        color: 'var(--color-primary)',
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'black'
                                    }
                                }}
                            >
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontFamily: 'var(--font-heading)' }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backgroundColor: 'var(--color-bg)',
                borderBottom: '1px solid var(--color-border)',
                backdropFilter: 'blur(10px)',
            }}
        >
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>

                    {/* Mobile Menu Icon */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            onClick={toggleDrawer(true)}
                            sx={{ color: 'var(--color-primary)' }}
                            aria-label="Open navigation menu"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Drawer
                            anchor="left"
                            open={drawerOpen}
                            onClose={toggleDrawer(false)}
                        >
                            {renderDrawer()}
                        </Drawer>
                    </Box>

                    {/* Logo */}
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <motion.div
                            className="header-logo"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            ECOMMERCE
                        </motion.div>
                    </Link>

                    {/* Desktop Nav */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
                        {navLinks.map((page) => {
                            const isActive = location.pathname === page.path;
                            return (
                                <Link
                                    key={page.text}
                                    to={page.path}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <motion.div
                                        whileHover={{ y: -2, color: 'var(--color-primary)' }}
                                        style={{
                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1rem',
                                            position: 'relative'
                                        }}
                                    >
                                        {page.text}
                                        {isActive && (
                                            <motion.div
                                                layoutId="underline"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: -4,
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    backgroundColor: 'var(--color-primary)'
                                                }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </Box>

                    {/* Icons */}
                    <Box sx={{ display: "flex", gap: { xs: 0.5, md: 2 }, alignItems: "center" }}>
                        <Tooltip title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                            <motion.div whileHover={{ scale: 1.1 }}>
                                <IconButton
                                    onClick={toggleTheme}
                                    sx={{
                                        color: 'var(--color-text)',
                                        '&:hover': { color: 'var(--color-primary)' },
                                        minWidth: { xs: '44px', md: 'auto' },
                                        minHeight: { xs: '44px', md: 'auto' }
                                    }}
                                    aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                            </motion.div>
                        </Tooltip>
                        <Tooltip title="Search">
                            <motion.div whileHover={{ scale: 1.1 }}>
                                <IconButton
                                    onClick={() => navigate("/search")}
                                    sx={{
                                        color: 'var(--color-text)',
                                        '&:hover': { color: 'var(--color-primary)' },
                                        minWidth: { xs: '44px', md: 'auto' },
                                        minHeight: { xs: '44px', md: 'auto' }
                                    }}
                                    aria-label="Search"
                                >
                                    <SearchIcon />
                                </IconButton>
                            </motion.div>
                        </Tooltip>
                        <Tooltip title="Cart">
                            <motion.div whileHover={{ scale: 1.1 }}>
                                <IconButton
                                    onClick={() => navigate("/cart")}
                                    sx={{
                                        color: 'var(--color-text)',
                                        '&:hover': { color: 'var(--color-primary)' },
                                        minWidth: { xs: '44px', md: 'auto' },
                                        minHeight: { xs: '44px', md: 'auto' }
                                    }}
                                    aria-label="View cart"
                                >
                                    <Badge badgeContent={cartItems.length} color="secondary" overlap="circular">
                                        <ShoppingCartIcon />
                                    </Badge>
                                </IconButton>
                            </motion.div>
                        </Tooltip>
                        {isAuthenticated ? (
                            <UserOptions user={user} />
                        ) : (
                            <Tooltip title="Login">
                                <motion.div whileHover={{ scale: 1.1 }}>
                                    <IconButton
                                        onClick={() => navigate("/login")}
                                        sx={{
                                            color: 'var(--color-primary)',
                                            border: '1px solid var(--color-primary)',
                                            borderRadius: '4px',
                                            padding: { xs: '8px', md: '8px' },
                                            minWidth: { xs: '44px', md: 'auto' },
                                            minHeight: { xs: '44px', md: 'auto' }
                                        }}
                                        aria-label="Login"
                                    >
                                        <PersonIcon />
                                    </IconButton>
                                </motion.div>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            </Container>
        </motion.header>
    );
};

export default Header;
