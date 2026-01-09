import React, { Fragment, useState } from 'react'
import "./Header.css"
import { SpeedDial,SpeedDialAction } from "@mui/material"
import DashBoardIcon from "@mui/icons-material/Dashboard"
import PersonIcon from "@mui/icons-material/Person"
import ExitToAppIcon from "@mui/icons-material/ExitToApp"
import ListAltIcon from "@mui/icons-material/ListAlt"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import {useNavigate} from "react-router-dom"
import { useAlert } from 'react-alert'
import { logout } from '../../../actions/userAction'
import { useDispatch,useSelector} from 'react-redux'
import Backdrop from "@mui/material/Backdrop"
const UserOptions = ({user}) => {
    const {cartItems}= useSelector((state)=>state.cart)
    const dispatch = useDispatch()
    const [ open,setOpen] = useState(false)
    const navigate = useNavigate()
    const alert = useAlert()
    const options =[
        {icon:<PersonIcon/>, name:"Profile",func:account},
        {icon:<ListAltIcon/>, name:"Orders",func:orders},
        {icon:<ShoppingCartIcon style={{color:cartItems.length>0?"tomato":"unset"}}/>, name:`Cart(${cartItems.length})`,func:cart},
        {icon:<ExitToAppIcon/>, name:"LogOut",func:logoutuser},
    ]
    if (user.role==="admin") {
        options.unshift({icon:<DashBoardIcon/>, name:"DashBoard",func:dashboard})
    }
    function dashboard() {
        navigate("/admin/dashboard")
    }
    function account() {
        navigate("/account")
    }
    function cart() {
        navigate("/cart")
    }
    function orders() {
        navigate('/orders')
    }
    function logoutuser() {
        navigate("/")
        dispatch(logout());
        alert.success("Logged out successfully")
    }
    return (
        <Fragment>
            <Backdrop open={open} style={{zIndex:"10"}}/>
            <SpeedDial
            ariaLabel="SpeedDial tooltip example"
            onClose={()=>setOpen(false)}
            onOpen={()=>setOpen(true)}
            style={{ zIndex: "11" }}
            open={open} 
            direction='down'
            className="speedDial"
            icon={
                <img
                className='speedDialIcon'
                src={user.avatar.url}
                alt='Profile'
                />}
            >
                {options.map((item)=>(
                    <SpeedDialAction 
                    key={item.name} 
                    icon={item.icon} 
                    tooltipTitle={item.name} 
                    onClick={item.func}
                    tooltipOpen={window.innerWidth<=600?true:false}
                    />
                ))}
            </SpeedDial>
        </Fragment>
    )
}

export default UserOptions
