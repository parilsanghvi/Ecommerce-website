import React, { useState } from 'react';
import { Box, Container, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import { Link, useNavigate } from 'react-router-dom';
import UserOptions from "./UserOptions";
import { useSelector } from 'react-redux';

const Header = () => {
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

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
                {navLinks.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton component={Link} to={item.path} sx={{
                            '&:hover': { backgroundColor: 'var(--color-primary)', color: 'black' }
                        }}>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontFamily: 'var(--font-heading)' }} />
                        </ListItemButton>
                    </ListItem>
                ))}
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
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: '1.5rem',
                                color: 'var(--color-text)',
                                border: '2px solid var(--color-text)',
                                padding: '4px 12px',
                                textTransform: 'uppercase',
                                letterSpacing: '-1px'
                            }}
                        >
                            ECOMMERCE
                        </motion.div>
                    </Link>

                    {/* Desktop Nav */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
                        {navLinks.map((page) => (
                            <Link
                                key={page.text}
                                to={page.path}
                                style={{ textDecoration: 'none' }}
                            >
                                <motion.div
                                    whileHover={{ y: -2, color: 'var(--color-primary)' }}
                                    style={{
                                        color: 'var(--color-text)',
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: '1rem',
                                        position: 'relative'
                                    }}
                                >
                                    {page.text}
                                </motion.div>
                            </Link>
                        ))}
                    </Box>

                    {/* Icons */}
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <Tooltip title="Search">
                            <motion.div whileHover={{ scale: 1.1 }}>
                                <IconButton onClick={() => navigate("/search")} sx={{ color: 'var(--color-text)', '&:hover': { color: 'var(--color-primary)' } }}>
                                    <SearchIcon />
                                </IconButton>
                            </motion.div>
                        </Tooltip>
                        <Tooltip title="Cart">
                            <motion.div whileHover={{ scale: 1.1 }}>
                                <IconButton onClick={() => navigate("/cart")} sx={{ color: 'var(--color-text)', '&:hover': { color: 'var(--color-primary)' } }}>
                                    <ShoppingCartIcon />
                                </IconButton>
                            </motion.div>
                        </Tooltip>
                        {isAuthenticated ? (
                            <UserOptions user={user} />
                        ) : (
                            <Tooltip title="Login">
                                <motion.div whileHover={{ scale: 1.1 }}>
                                    <IconButton onClick={() => navigate("/login")} sx={{ color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '4px' }}>
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
