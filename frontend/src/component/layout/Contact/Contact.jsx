import React from "react";
import "./Contact.css";
import { Button } from "@mui/material";
import { motion } from "framer-motion";

const Contact = () => {
  return (
    <div className="contactContainer">
      <motion.a
        className="mailBtn"
        href="mailto:parilsanghvi@gmail.com"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <Button>Contact: parilsanghvi@gmail.com</Button>
      </motion.a>
    </div>
  );
};

export default Contact;
