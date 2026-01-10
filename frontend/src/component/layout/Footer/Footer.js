import React from "react";
import playstore from "../../../images/playstore.png"
import appstore from "../../../images/Appstore.png"
import "./Footer.css"
const Footer = () => {
    return (
        <footer id="footer">
            <div className="leftFooter">
                <h4>Download our App</h4>
                <p>Download our App for Android and Iphone</p>
                <img src={playstore} alt="playstore" />
                <img src={appstore} alt="appstore" />
            </div>
            <div className="midFooter">
                <h1>Ecommerce Website</h1>
                <p>Quality over Quantity</p>
                <p>Copyrights 2026 &copy; ParilSanghvi</p>
            </div>
            <div className="rightFooter">
                <h4>Hope you like my website</h4>
                <a href="https://github.com/parilsanghvi">Github</a>
                <a href="https://www.linkedin.com/in/paril-sanghvi/">Linkedin</a>
            </div>
        </footer>
    );
};

export default Footer