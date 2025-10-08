import { Navigate, Outlet } from "react-router";
import { isTokenValid } from "./auth";

export default function PrivateRoute() {
  return isTokenValid() ? <Outlet /> : <Navigate to="/login" replace />;
}
