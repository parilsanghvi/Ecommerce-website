import React, { Fragment } from "react";
import { Typography, Stepper, StepLabel, Step } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LibraryAddCheckIcon from "@mui/icons-material/LibraryAddCheck";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import "./CheckoutSteps.css";

const CheckoutSteps = ({ activeStep }) => {
  const steps = [
    {
      label: <Typography style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>SHIPPING</Typography>,
      icon: <LocalShippingIcon />,
    },
    {
      label: <Typography style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>CONFIRM</Typography>,
      icon: <LibraryAddCheckIcon />,
    },
    {
      label: <Typography style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>PAYMENT</Typography>,
      icon: <AccountBalanceIcon />,
    },
  ];

  const stepStyles = {
    boxSizing: "border-box",
    marginTop: "2rem",
    marginBottom: "2rem",
    backgroundColor: "transparent",
  };

  return (
    <Fragment>
      <Stepper alternativeLabel activeStep={activeStep} style={stepStyles}>
        {steps.map((item, index) => (
          <Step
            key={index}
            active={activeStep === index ? true : false}
            completed={activeStep >= index ? true : false}
          >
            <StepLabel
              StepIconProps={{
                style: {
                    color: activeStep >= index ? "var(--color-primary)" : "var(--color-muted)",
                    fontSize: "2rem"
                }
              }}
              style={{
                color: activeStep >= index ? "var(--color-primary)" : "var(--color-muted)",
              }}
              icon={item.icon}
            >
              {item.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Fragment>
  );
};

export default CheckoutSteps;
