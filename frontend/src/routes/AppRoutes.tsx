import { BrowserRouter, Route, Routes } from "react-router-dom";

import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import AdminDashboardPage from "../pages/Dashboard/AdminDashboardPage";
import CustomerDashboardPage from "../pages/Dashboard/CustomerDashboardPage";
import StaffDashboardPage from "../pages/Dashboard/StaffDashboardPage";
import HomePage from "../pages/Home/HomePage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
                    <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
                    <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
