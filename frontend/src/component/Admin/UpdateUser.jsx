import React, { Fragment, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Button } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AdminLayout from "./AdminLayout";
import useErrorNotification from "../../hooks/useErrorNotification";
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

  useErrorNotification(error, clearErrors);
  useErrorNotification(updateError, clearErrors);

  useEffect(() => {
    if ((!user || user._id !== userId) && !loading) { // Guard against loop and check id
      dispatch(getUserDetails(userId));
    } else if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }

    if (isUpdated) {
      enqueueSnackbar("User Updated Successfully", { variant: "success" });
      navigate("/admin/users");
      dispatch(updateUserReset());
    }
  }, [dispatch, enqueueSnackbar, navigate, isUpdated, user, userId, loading]);

  const updateUserSubmitHandler = (e) => {
    e.preventDefault();

    const myForm = new FormData();

    myForm.set("name", name);
    myForm.set("email", email);
    myForm.set("role", role);

    dispatch(updateUser({ id: userId, userData: myForm })); // Correct action signature
  };

  return (
    <AdminLayout title="Update User">
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
                aria-label="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updateLoading}
              />
            </div>
            <div>
              <MailOutlineIcon />
              <input
                type="email"
                placeholder="Email"
                aria-label="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={updateLoading}
              />
            </div>

            <div>
              <VerifiedUserIcon />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Role"
                disabled={updateLoading}
              >
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
    </AdminLayout>
  );
};

export default UpdateUser;
