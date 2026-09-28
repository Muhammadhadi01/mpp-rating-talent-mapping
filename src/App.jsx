import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Assessment from "./pages/Assessment";
import TalentMapping from "./pages/TalentMapping";
import Grafik from "./pages/Grafik";
import Ranking from "./pages/Ranking";

import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* =========================
                    LOGIN
                ========================= */}
                <Route
                    path="/"
                    element={<Login />}
                />

                {/* =========================
                    DASHBOARD
                ========================= */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* =========================
                    KARYAWAN
                ========================= */}
                <Route
                    path="/employees"
                    element={
                        <ProtectedRoute>
                            <Employees />
                        </ProtectedRoute>
                    }
                />

                {/* =========================
                    PENILAIAN
                ========================= */}
                <Route
                    path="/assessment"
                    element={
                        <ProtectedRoute>
                            <Assessment />
                        </ProtectedRoute>
                    }
                />

                {/* =========================
                    TALENT MAPPING
                ========================= */}
                <Route
                    path="/talent"
                    element={
                        <ProtectedRoute>
                            <TalentMapping />
                        </ProtectedRoute>
                    }
                />

                {/* =========================
                    RANKING
                ========================= */}
                <Route
                    path="/ranking"
                    element={
                        <ProtectedRoute>
                            <Ranking />
                        </ProtectedRoute>
                    }
                />

                {/* =========================
                    GRAFIK
                ========================= */}
                <Route
                    path="/grafik"
                    element={
                        <ProtectedRoute>
                            <Grafik />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}