import React, { Fragment, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Button } from "@mui/material";
import MetaData from "../layout/MetaData";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SideBar from "./Sidebar";
import {
  getUserDetails,
  updateUser,
  clearErrors,
  updateUserReset
} from "../../features/userSlice";
import Loader from "../layout/Loader";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";

const UpdateUser = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const params = useParams();

  const { loading, error, userDetails: user } = useSelector((state) => state.user); // Correct selector

  const {
    loading: updateLoading,
    error: updateError,
    isUpdated,
  } = useSelector((state) => state.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const userId = params.id;

  useEffect(() => {
    if ((!user || user._id !== userId) && !loading) { // Guard against loop and check id
      dispatch(getUserDetails(userId));
    } else if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }

    if (updateError) {
      enqueueSnackbar(updateError, { variant: "error" });
      dispatch(clearErrors());
    }

    if (isUpdated) {
      enqueueSnackbar("User Updated Successfully", { variant: "success" });
      navigate("/admin/users");
      dispatch(updateUserReset());
    }
  }, [dispatch, enqueueSnackbar, error, navigate, isUpdated, updateError, user, userId, loading]);

  const updateUserSubmitHandler = (e) => {
    e.preventDefault();

    const myForm = new FormData();

    myForm.set("name", name);
    myForm.set("email", email);
    myForm.set("role", role);

    dispatch(updateUser({ id: userId, userData: myForm })); // Correct action signature
  };

  return (
    <Fragment>
      <MetaData title="Update User" />
      <div className="dashboard">
        <SideBar />
        <div className="newProductContainer">
          {loading ? (
            <Loader />
          ) : (
            <form
              className="createProductForm"
              onSubmit={updateUserSubmitHandler}
              style={{
                height: "auto",
                padding: "2rem",
                boxShadow: "8px 8px 0 var(--color-primary)",
                border: "2px solid var(--color-text)",
                backgroundColor: "var(--color-surface)"
              }}
            >
              <h1 className="section-heading" style={{ borderBottom: 'none', marginBottom: '1rem' }}>Update User</h1>

              <div>
                <PersonIcon />
                <input
                  type="text"
                  placeholder="Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <MailOutlineIcon />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <VerifiedUserIcon />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="">Choose Role</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <button
                id="createProductBtn"
                type="submit"
                className="primary-btn"
                disabled={
                  updateLoading ? true : false || role === "" ? true : false
                }
                style={{ marginTop: '2rem' }}
              >
                Update
              </button>
            </form>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default UpdateUser;
