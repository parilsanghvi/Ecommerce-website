import React, { Fragment } from "react";
import MetaData from "../layout/MetaData";
import SideBar from "./Sidebar";

const AdminLayout = ({ children, title }) => (
    <Fragment>
        <MetaData title={title} />
        <div className="dashboard">
            <SideBar />
            <div className="dashboardContainer">{children}</div>
        </div>
    </Fragment>
);

export default AdminLayout;
