import React, { Fragment, useState, useEffect } from "react";
import "./UpdateProfile.css";
import Loader from "../layout/Loader";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import FaceIcon from "@mui/icons-material/Face";
import { useDispatch, useSelector } from "react-redux";
import { clearErrors, updateProfile, loadUser } from "../../features/userSlice";
import { useSnackbar } from "notistack";
import { updateProfileReset } from "../../features/userSlice"; // using exported reset action
import MetaData from "../layout/MetaData";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";

const UpdateProfile = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);
  const { error, isUpdated, loading } = useSelector((state) => state.user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState();
  const [avatarPreview, setAvatarPreview] = useState();

  const updateProfileSubmit = (e) => {
    e.preventDefault();

    const myForm = new FormData();

    myForm.set("name", name);
    myForm.set("email", email);
    myForm.set("avatar", avatar);
    dispatch(updateProfile(myForm));
  };

  const updateProfileDataChange = (e) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatarPreview(reader.result);
        setAvatar(reader.result);
      }
    };

    reader.readAsDataURL(e.target.files[0]);
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatarPreview(user.avatar.url);
    }

    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }

    if (isUpdated) {
      enqueueSnackbar("Profile Updated Successfully", { variant: "success" });
      dispatch(loadUser());

      navigate("/account");

      dispatch(updateProfileReset());
    }
  }, [dispatch, error, enqueueSnackbar, navigate, user, isUpdated, avatar]);
  return (
    <Fragment>

          <MetaData title="Update Profile" />
          <div className="updateProfileContainer">
            <div className="updateProfileBox">
              <h2 className="updateProfileHeading">Update Profile</h2>

              <form
                className="updateProfileForm"
                encType="multipart/form-data"
                onSubmit={updateProfileSubmit}
              >
                <div className="updateProfileName">
                  <FaceIcon aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Name"
                    aria-label="Name"
                    required
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="updateProfileEmail">
                  <MailOutlineIcon aria-hidden="true" />
                  <input
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    required
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div id="updateProfileImage">
                  <img src={avatarPreview} alt="Avatar Preview" />
                  <input
                    type="file"
                    name="avatar"
                    accept="image/*"
                    aria-label="Avatar Upload"
                    onChange={updateProfileDataChange}
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                  style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}
                >
                  {loading ? (
                    <Fragment>
                      <CircularProgress size={20} color="inherit" />
                      Updating...
                    </Fragment>
                  ) : (
                    "Update"
                  )}
                </button>
              </form>
            </div>
          </div>
        </Fragment>
  );
};

export default UpdateProfile;
