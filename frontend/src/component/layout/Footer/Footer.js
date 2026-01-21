import React from "react";
import playStore from "../../../images/playstore.png";
import appStore from "../../../images/Appstore.png";
import "./Footer.css";

const Footer = () => {
  return (
    <footer id="footer">
      <div className="leftFooter">
        <h4>DOWNLOAD OUR APP</h4>
        <p>Download App for Android and IOS mobile phone</p>
        <div style={{display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center'}}>
            <img src={playStore} alt="playstore" style={{width: '120px', border: '1px solid #333'}} />
            <img src={appStore} alt="Appstore" style={{width: '120px', border: '1px solid #333'}} />
        </div>
      </div>

      <div className="midFooter">
        <h1>ECOMMERCE</h1>
        <p>High Quality is our first priority</p>
        <p>Copyrights 2026 &copy; Paril Sanghvi</p>
      </div>

      <div className="rightFooter">
        <h4>Follow Us</h4>
        <a href="https://www.instagram.com/parilsanghvi" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://www.linkedin.com/in/paril-sanghvi/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </footer>
  );
};

export default Footer;
