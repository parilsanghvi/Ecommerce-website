import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import Loader from "../layout/Loader";
import Payment from "./Payment";

const PaymentWrapper = () => {
    const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    async function getStripeApiKey() {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/stripeapikey`);
                setStripePromise(loadStripe(data.stripeApiKey));
      } catch (error) {
        console.log("Stripe API key not found or backend unreachable");
      }
    }
    getStripeApiKey();
  }, []);

  return stripePromise ? (
    <Elements stripe={stripePromise}>
      <Payment />
    </Elements>
  ) : (
    <Loader />
  );
};

export default PaymentWrapper;
