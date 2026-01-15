import React from "react";
import "./aboutSection.css";
import { Button, Typography, Avatar } from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
const About = () => {
  const visitGitHub = () => {
    window.location = "https://github.com/Thunderer0";
  };
  return (
    <div className="aboutSection">
      <div></div>
      <div className="aboutSectionGradient"></div>
      <div className="aboutSectionContainer">
        <Typography component="h1">About Me</Typography>

        <div>
          <div>
            <Avatar
              style={{ width: "10vmax", height: "10vmax", margin: "2vmax 0" }}
              src="https://res.cloudinary.com/ecommerce0510/image/upload/v1643263274/avatars/271132470_506892223917314_2788328017502867722_n_k8rny8.jpg"
              alt="Founder"
            />
            <Typography>Paril Sanghvi</Typography>
            <Button onClick={visitGitHub} color="primary">
              Visit GitHub
            </Button>
            <span>
              This is a sample wesbite made by Paril Sanghvi.
            </span>
          </div>
          <div className="aboutSectionContainer2">
            <Typography component="h2">Contact Me</Typography>
            <a
              href="https://www.linkedin.com/in/paril-sanghvi-38627b217/"
              target="blank"
            >
              <LinkedInIcon className="youtubeSvgIcon" />
            </a>

            <a href="https://github.com/Thunderer0" target="blank">
              <GitHubIcon className="instagramSvgIcon" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
