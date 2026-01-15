import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Box, Drawer, List, ListItem, ListItemButton, ListItemText, Container, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import { Link, useNavigate } from 'react-router-dom';
import logo from "../../../images/logo.png";
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
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                {navLinks.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton component={Link} to={item.path}>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <AppBar position="sticky" sx={{ backgroundColor: "white", color: "black", boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                    {/* Mobile Menu Icon (Left) */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="menu"
                            onClick={toggleDrawer(true)}
                            color="inherit"
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

                    {/* Logo (Center on Mobile, Left on Desktop) */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Link to="/">
                            <img src={logo} alt="Ecommerce" style={{ height: '50px', objectFit: 'contain' }} />
                        </Link>
                    </Box>

                    {/* Desktop Nav (Center) */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
                        {navLinks.map((page) => (
                            <Button
                                key={page.text}
                                component={Link}
                                to={page.path}
                                sx={{ my: 2, color: 'black', display: 'block', textTransform: 'none', fontSize: '1rem', fontWeight: 500, '&:hover': { color: '#eb4034' } }}
                            >
                                {page.text}
                            </Button>
                        ))}
                    </Box>

                    {/* Icons (Right) */}
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <IconButton color="inherit" onClick={() => navigate("/search")}>
                            <SearchIcon />
                        </IconButton>
                        <IconButton color="inherit" onClick={() => navigate("/cart")}>
                            <ShoppingCartIcon />
                        </IconButton>
                        {isAuthenticated ? (
                            <UserOptions user={user} />
                        ) : (
                            <IconButton color="inherit" onClick={() => navigate("/login")}>
                                <PersonIcon />
                            </IconButton>
                        )}
                    </Box>

                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Header;