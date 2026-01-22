import React, { Fragment, useState, useEffect } from 'react'
import "./ResetPassword.css";
import { useDispatch, useSelector } from "react-redux";
import { clearErrors, resetPassword } from "../../features/userSlice";
import { useSnackbar } from "notistack";
import Loader from "../layout/Loader";
import MetaData from "../layout/MetaData";
import LockOpenIcon from "@mui/icons-material/LockOpen"
import LockIcon from "@mui/icons-material/Lock"
import { useNavigate, useParams } from 'react-router-dom';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const params = useParams();


  const { error, success, loading } = useSelector((state) => state.user);
  const [password, setPassword] = useState()
  const [confirmPassword, setConfirmPassword] = useState()

  const resetPasswordSubmit = (e) => {
    e.preventDefault();

    const myForm = new FormData();
    myForm.set("password", password);
    myForm.set("confirmPassword", confirmPassword);
    dispatch(resetPassword(params.token, myForm));
  };


  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }

    if (success) {
      navigate("/login");
      enqueueSnackbar("Password Updated Successfully", { variant: "success" });
    }
  }, [dispatch, error, enqueueSnackbar, navigate, success]);
  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaData title="Change Password" />
          <div className="resetPasswordContainer">
            <div className="resetPasswordBox">
              <h2 className="resetPasswordHeading">Update Password</h2>

              <form
                className="resetPasswordForm"
                encType="multipart/form-data"
                onSubmit={resetPasswordSubmit}
              >
                <div >
                  <LockOpenIcon />
                  <input type="password"
                    placeholder="New Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <LockIcon />
                  <input type="password"
                    placeholder="Confirm Password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <input
                  type="submit"
                  value="Update"
                  className="resetPasswordBtn"
                />
              </form>
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
}

export default ResetPassword
