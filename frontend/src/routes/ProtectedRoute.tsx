import { Navigate, Outlet } from "react-router-dom";

type Role = "ADMIN" | "STAFF" | "CUSTOMER";

type ProtectedRouteProps = {
    allowedRoles: Role[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role") as Role | null;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}

