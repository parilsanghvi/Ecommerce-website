import React, { Fragment, useRef, useState, useEffect } from 'react'
import "./LoginSignup.css"
import { Link, useNavigate, useLocation } from 'react-router-dom'
import MailOutlineIcon from "@mui/icons-material/MailOutline"
import LockOpenIcon from "@mui/icons-material/LockOpen"
import FaceIcon from "@mui/icons-material/Face"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import { MdErrorOutline } from "react-icons/md";
import { CircularProgress } from "@mui/material";
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
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [activeTab, setActiveTab] = useState("login")
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
        setActiveTab(tab);
        if (tab === "login") {
            switcherTab.current.classList.add("shiftToNeutral")
            switcherTab.current.classList.remove("shiftToRight")

            registerTab.current.classList.remove("shiftToNeutralForm")
            loginTab.current.classList.remove("shiftToLeft")
            clearLocalAndGlobalErrors();
            setActiveTab("login");
        }
        if (tab === "register") {
            switcherTab.current.classList.remove("shiftToNeutral")
            switcherTab.current.classList.add("shiftToRight")

            registerTab.current.classList.add("shiftToNeutralForm")
            loginTab.current.classList.add("shiftToLeft")
            clearLocalAndGlobalErrors();
            setActiveTab("register");
        }
    }
    return (
        <Fragment>
            <div className='LoginSignUpContainer'>
                <div className='LoginSignUpBox'>
                    <div>
                        <div className='login_signUp_toggle' role="tablist">
                            <button
                                className="toggle-btn"
                                onClick={(e) => switchTabs(e, "login")}
                                role="tab"
                                aria-selected={activeTab === "login"}
                                aria-controls="login-panel"
                                id="login-tab"
                                disabled={loading}
                            >
                                Login
                            </button>
                            <button
                                className="toggle-btn"
                                onClick={(e) => switchTabs(e, "register")}
                                role="tab"
                                aria-selected={activeTab === "register"}
                                aria-controls="register-panel"
                                id="register-tab"
                                disabled={loading}
                            >
                                Register
                            </button>
                        </div>
                        <div className="slider-line" ref={switcherTab}></div>
                    </div >
                    {(error || localError) && (
                        <div className="loginError" role="alert" aria-live="assertive">
                            <MdErrorOutline aria-hidden="true" />
                            <span>{localError || (error === "Field value too long" ? "File is too large" : error)}</span>
                        </div>
                    )}
                    <form
                        className='loginForm'
                        ref={loginTab}
                        onSubmit={loginSubmit}
                        role="tabpanel"
                        id="login-panel"
                        aria-labelledby="login-tab"
                        aria-hidden={activeTab !== "login"}
                    >
                        <div className='loginEmail'>
                            <MailOutlineIcon />
                            <input
                                type="email"
                                placeholder="Email"
                                aria-label="Login Email"
                                required
                                value={loginEmail}
                                disabled={loading}
                                onChange={(e) => {
                                    setLoginEmail(e.target.value);
                                    clearLocalAndGlobalErrors();
                                }}
                            />
                        </div>
                        <div className='loginPassword'>
                            <LockOpenIcon />
                            <input
                                type={showLoginPassword ? "text" : "password"}
                                placeholder="Password"
                                aria-label="Login Password"
                                required
                                value={loginPassword}
                                disabled={loading}
                                onChange={(e) => {
                                    setLoginPassword(e.target.value);
                                    clearLocalAndGlobalErrors();
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="password-toggle-btn"
                                aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                disabled={loading}
                            >
                                {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                            </button>
                        </div>
                        <Link to="/password/forgot">Forgot Password ?</Link>
                        <button type="submit" className='primary-btn' disabled={loading} aria-busy={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {loading ? <CircularProgress size={20} color="inherit" /> : null}
                            {loading ? "Logging In..." : "Login"}
                        </button>
                    </form>
                    <form
                        className='signUpForm'
                        ref={registerTab}
                        encType='multipart/form-data'
                        onSubmit={registerSubmit}
                        role="tabpanel"
                        id="register-panel"
                        aria-labelledby="register-tab"
                        aria-hidden={activeTab !== "register"}
                    >
                        <div className='signUpName'>
                            <FaceIcon />
                            <input
                                type="text"
                                placeholder="Name"
                                aria-label="Name"
                                required
                                name="name"
                                value={name}
                                disabled={loading}
                                onChange={registerDataChange}
                            />
                        </div>
                        <div className='signUpEmail'>
                            <MailOutlineIcon />
                            <input
                                type="email"
                                placeholder="Email"
                                aria-label="Email"
                                required
                                name='email'
                                value={email}
                                disabled={loading}
                                onChange={registerDataChange}
                            />
                        </div>
                        <div className='signUpPassword'>
                            <LockOpenIcon />
                            <input
                                type={showRegisterPassword ? "text" : "password"}
                                placeholder="Password"
                                aria-label="Password"
                                required
                                name='password'
                                value={password}
                                disabled={loading}
                                onChange={registerDataChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                className="password-toggle-btn"
                                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                                disabled={loading}
                            >
                                {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                            </button>
                        </div>
                        <div id='registerImage'>
                            <img src={avatarPreview} alt="avatar preview" />
                            <input
                                type="file"
                                name='avatar'
                                accept='image/*'
                                aria-label="Avatar Upload"
                                disabled={loading}
                                onChange={registerDataChange}
                            />
                        </div>
                        <button type="submit" className='primary-btn' disabled={loading} aria-busy={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {loading ? <CircularProgress size={20} color="inherit" /> : null}
                            {loading ? "Registering..." : "Register"}
                        </button>
                    </form>
                </div >
            </div >
        </Fragment >
    )
}

export default LoginSignup
