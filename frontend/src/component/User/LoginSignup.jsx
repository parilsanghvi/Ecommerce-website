import React, { Fragment, useRef, useState, useEffect } from 'react'
import "./LoginSignup.css"
import Loader from "../layout/Loader"
import { Link, useNavigate, useLocation } from 'react-router-dom'
import MailOutlineIcon from "@mui/icons-material/MailOutline"
import LockOpenIcon from "@mui/icons-material/LockOpen"
import FaceIcon from "@mui/icons-material/Face"
import { MdErrorOutline } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux"
import { clearErrors, login, register } from "../../features/userSlice";
import { useSnackbar } from "notistack"

const LoginSignup = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const location = useLocation();

    const loginTab = useRef(null)
    const registerTab = useRef(null)
    const switcherTab = useRef(null)

    const { error, loading, isAuthenticated } = useSelector(state => state.user)
    const [loginEmail, setLoginEmail] = useState("")
    const [loginPassword, setLoginPassword] = useState("")
    const [user, setUser] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [avatar, setAvatar] = useState("")
    const [avatarPreview, setAvatarPreview] = useState("/Profile.png")
    const { name, email, password } = user;
    const [localError, setLocalError] = useState("");

    const clearLocalAndGlobalErrors = () => {
        setLocalError("");
        if (error) dispatch(clearErrors());
    }

    const loginSubmit = (e) => {
        e.preventDefault();
        dispatch(login({ email: loginEmail, password: loginPassword }))
    }
    const registerSubmit = (e) => {
        e.preventDefault();
        const myForm = new FormData()
        myForm.set("name", name)
        myForm.set("email", email)
        myForm.set("password", password)
        myForm.set("avatar", avatar)
        dispatch(register(myForm))
    }
    const registerDataChange = (e) => {
        clearLocalAndGlobalErrors();
        if (e.target.name === "avatar") {
            const file = e.target.files[0];
            if (file && file.size > 750 * 1024) { // 750KB limit
                setLocalError("File is too large (max 750KB)");
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                if (reader.readyState === 2) {
                    setAvatarPreview(reader.result)
                    setAvatar(reader.result)
                }
            }
            if (file) {
                reader.readAsDataURL(file);
            }
        } else {
            setUser({ ...user, [e.target.name]: e.target.value });
        }
    }
    const redirect = location.search ? new URLSearchParams(location.search).get("redirect") : "/account";
    useEffect(() => {
        // Clear errors on initial mount / unmount to avoid stale errors
        dispatch(clearErrors());

        // No toast notification for error
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirect)
        }
    }, [navigate, isAuthenticated, redirect])


    const switchTabs = (e, tab) => {
        if (tab === "login") {
            switcherTab.current.classList.add("shiftToNeutral")
            switcherTab.current.classList.remove("shiftToRight")

            registerTab.current.classList.remove("shiftToNeutralForm")
            loginTab.current.classList.remove("shiftToLeft")
            clearLocalAndGlobalErrors();
        }
        if (tab === "register") {
            switcherTab.current.classList.remove("shiftToNeutral")
            switcherTab.current.classList.add("shiftToRight")

            registerTab.current.classList.add("shiftToNeutralForm")
            loginTab.current.classList.add("shiftToLeft")
            clearLocalAndGlobalErrors();
        }
    }
    return (
        <Fragment>
            {loading ? (<Loader />
            ) : (
                <Fragment>
                    <div className='LoginSignUpContainer'>
                        <div className='LoginSignUpBox'>
                            <div>
                                <div className='login_signUp_toggle'>
                                    <p onClick={(e) => switchTabs(e, "login")}>Login</p>
                                    <p onClick={(e) => switchTabs(e, "register")}>Register</p>
                                </div>
                                <button ref={switcherTab}></button>
                            </div>
                            {(error || localError) && (
                                <div className="loginError">
                                    <MdErrorOutline />
                                    <span>{localError || (error === "Field value too long" ? "File is too large" : error)}</span>
                                </div>
                            )}
                            <form className='loginForm' ref={loginTab} onSubmit={loginSubmit}>
                                <div className='loginEmail'>
                                    <MailOutlineIcon />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        required
                                        value={loginEmail}
                                        onChange={(e) => {
                                            setLoginEmail(e.target.value);
                                            clearLocalAndGlobalErrors();
                                        }}
                                    />
                                </div>
                                <div className='loginPassword'>
                                    <LockOpenIcon />
                                    <input type="password"
                                        placeholder="Password"
                                        required
                                        value={loginPassword}
                                        onChange={(e) => {
                                            setLoginPassword(e.target.value);
                                            clearLocalAndGlobalErrors();
                                        }}
                                    />
                                </div>
                                <Link to="/password/forgot">Forgot Password ?</Link>
                                <input type="submit" value="Login" className='primary-btn' />
                            </form>
                            <form className='signUpForm' ref={registerTab} encType='multipart/form-data' onSubmit={registerSubmit}>
                                <div className='signUpName'>
                                    <FaceIcon />
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        required
                                        name="name"
                                        value={name}
                                        onChange={registerDataChange}
                                    />
                                </div>
                                <div className='signUpEmail'>
                                    <MailOutlineIcon />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        required
                                        name='email'
                                        value={email}
                                        onChange={registerDataChange}
                                    />
                                </div>
                                <div className='signUpPassword'>
                                    <LockOpenIcon />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        required
                                        name='password'
                                        value={password}
                                        onChange={registerDataChange}
                                    />
                                </div>
                                <div id='registerImage'>
                                    <img src={avatarPreview} alt="avatar preview" />
                                    <input
                                        type="file"
                                        name='avatar'
                                        accept='image/*'
                                        onChange={registerDataChange}
                                    />
                                </div>
                                <input
                                    type="submit"
                                    value="Register"
                                    className='primary-btn'
                                />
                            </form>
                        </div>
                    </div>
                </Fragment>
            )}
        </Fragment>
    )
}

export default LoginSignup
