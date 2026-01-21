import React from "react";
import "./About.css";
import { Button, Typography, Avatar } from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import { motion } from "framer-motion";

const About = () => {
  const visitGitHub = () => {
    window.location = "https://github.com/Thunderer0";
  };
  return (
    <div className="aboutSection">
      <div className="aboutSectionContainer">
        <motion.h1
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            About Me
        </motion.h1>

        <div className="aboutCard">
          <div className="profileSection">
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <Avatar
                  style={{ width: "150px", height: "150px", margin: "20px auto", border: '2px solid var(--color-primary)' }}
                  src="https://res.cloudinary.com/ecommerce0510/image/upload/v1643263274/avatars/271132470_506892223917314_2788328017502867722_n_k8rny8.jpg"
                  alt="Founder"
                />
                <Typography variant="h4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>Paril Sanghvi</Typography>
                <Button onClick={visitGitHub} style={{ color: 'var(--color-text)', fontFamily: 'var(--font-body)', marginTop: '10px', border: '1px solid var(--color-border)' }}>
                  Visit GitHub
                </Button>
                <span style={{ display: 'block', marginTop: '20px', color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
                  This is a sample wesbite made by Paril Sanghvi.
                </span>
            </motion.div>
          </div>

          <div className="aboutSectionContainer2">
            <Typography component="h2" style={{ fontFamily: 'var(--font-heading)', marginBottom: '20px' }}>Connect</Typography>
            <div className="socialIcons">
                <a
                  href="https://www.linkedin.com/in/paril-sanghvi-38627b217/"
                  target="blank"
                >
                  <LinkedInIcon style={{ fontSize: '3rem' }} />
                </a>

                <a href="https://github.com/Thunderer0" target="blank">
                  <GitHubIcon style={{ fontSize: '3rem' }} />
                </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
