import { Navigate, Outlet } from "react-router";
import { isUserAdmin, isTokenValid } from "./auth";

export default function AdminRoute() {
    // First ensure user is authenticated
    if (!isTokenValid()) return <Navigate to="/login" replace />;
    // Then ensure user is admin
    return isUserAdmin() ? <Outlet /> : <Navigate to="/" replace />;
}
