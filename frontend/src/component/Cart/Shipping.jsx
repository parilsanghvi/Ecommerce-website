import React, { Fragment, useState, useMemo } from "react";
import "./Shipping.css";
import { useSelector, useDispatch } from "react-redux";
import { saveShippingInfo } from "../../features/cartSlice";
import MetaData from "../layout/MetaData";
import PinDropIcon from "@mui/icons-material/PinDrop";
import HomeIcon from "@mui/icons-material/Home";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PublicIcon from "@mui/icons-material/Public";
import PhoneIcon from "@mui/icons-material/Phone";
import TransferWithinAStationIcon from "@mui/icons-material/TransferWithinAStation";
import { Country, State } from "country-state-city";
import { useSnackbar } from "notistack";
import CheckoutSteps from "../Cart/CheckoutSteps";
import { useNavigate } from "react-router-dom";

const Shipping = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { shippingInfo } = useSelector((state) => state.cart);

  const [address, setAddress] = useState(shippingInfo.address);
  const [city, setCity] = useState(shippingInfo.city);
  const [state, setState] = useState(shippingInfo.state);
  const [country, setCountry] = useState(shippingInfo.country);
  const [pinCode, setPinCode] = useState(shippingInfo.pinCode);
  const [phoneNo, setPhoneNo] = useState(shippingInfo.phoneNo);

  // ⚡ Bolt: Memoize heavy library calls to avoid recalculating static data on every keystroke
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const allStatesOfCountry = useMemo(() => country ? State.getStatesOfCountry(country) : [], [country]);

  const shippingSubmit = (e) => {
    e.preventDefault();

    if (phoneNo.length < 10 || phoneNo.length > 10) {
      enqueueSnackbar("Phone Number should be 10 digits long", { variant: "error" });
      return;
    }
    dispatch(
      saveShippingInfo({ address, city, state, country, pinCode, phoneNo })
    );
    navigate("/order/confirm");
  };

  return (
    <Fragment>
      <MetaData title="Shipping Details" />

      <CheckoutSteps activeStep={0} />

      <div className="shippingContainer">
        <div className="shippingBox">
          <h2 className="shippingHeading">Shipping Details</h2>

          <form
            className="shippingForm"
            encType="multipart/form-data"
            onSubmit={shippingSubmit}
          >
            <div>
              <HomeIcon aria-hidden="true" />
              <input
                type="text"
                placeholder="Address"
                aria-label="Address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <LocationCityIcon aria-hidden="true" />
              <input
                type="text"
                placeholder="City"
                aria-label="City"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <PinDropIcon aria-hidden="true" />
              <input
                type="number"
                placeholder="Pin Code"
                aria-label="Pin Code"
                required
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
              />
            </div>

            <div>
              <PhoneIcon aria-hidden="true" />
              <input
                type="number"
                placeholder="Phone Number"
                aria-label="Phone Number"
                required
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                size="10"
              />
            </div>

            <div>
              <PublicIcon aria-hidden="true" />

              <select
                required
                value={country}
                aria-label="Country"
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Country</option>
                {allCountries.map((item) => (
                  <option key={item.isoCode} value={item.isoCode}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {country && (
              <div>
                <TransferWithinAStationIcon aria-hidden="true" />

                <select
                  required
                  value={state}
                  aria-label="State"
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">State</option>
                  {allStatesOfCountry.map((item) => (
                    <option key={item.isoCode} value={item.isoCode}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="submit"
              value="Continue"
              className="shippingBtn"
              disabled={state ? false : true}
            />
          </form>
        </div>
      </div>
    </Fragment>
  );
};

export default Shipping;
