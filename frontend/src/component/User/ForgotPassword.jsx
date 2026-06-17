import React, { Fragment, useState, useEffect } from "react";
import "./ForgotPassword.css";
import Loader from "../layout/Loader";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { CircularProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { clearErrors, forgotPassword } from "../../features/userSlice";
import { useSnackbar } from "notistack";
import MetaData from "../layout/MetaData";
const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { error, message, loading } = useSelector((state) => state.user);

  const [email, setEmail] = useState("")
  const forgotPasswordSubmit = (e) => {
    e.preventDefault();

    const myForm = new FormData();
    myForm.set("email", email);
    dispatch(forgotPassword(myForm));
  };
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }

    if (message) {
      enqueueSnackbar(message, { variant: "success" });
    }
  }, [dispatch, error, enqueueSnackbar, message]);
  return (
    <Fragment>

          <MetaData title="Forgot Password" />
          <div className="forgotPasswordContainer">
            <div className="forgotPasswordBox">
              <h2 className="forgotPasswordHeading">Forgot Password</h2>

              <form
                className="forgotPasswordForm"
                onSubmit={forgotPasswordSubmit}
              >
                <div className="forgotPasswordEmail">
                  <MailOutlineIcon />
                  <input
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    required
                    name="email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                  aria-busy={loading}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '2rem' }}
                >
                  {loading ? <><CircularProgress size={20} color="inherit" /> Sending...</> : "Send"}
                </button>
              </form>
            </div>
          </div>
        </Fragment>
  )
}

export default ForgotPassword
