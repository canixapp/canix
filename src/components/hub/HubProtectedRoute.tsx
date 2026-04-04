import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const HubProtectedRoute = () => {
  const isAuth = sessionStorage.getItem("canix_hub_session") === "true";

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default HubProtectedRoute;
