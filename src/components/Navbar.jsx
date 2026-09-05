import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";
import logo from "../assets/playtopia-logo.png";

export default function Navbar() {

    const location = useLocation();
    const navigate = useNavigate();

    // =========================
    // LOGOUT
    // =========================
    async function logout() {

        const result = await Swal.fire({
            title: "Logout ?",
            text: "Anda akan keluar dari sistem",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, Logout",
            cancelButtonText: "Batal"
        });

        if (!result.isConfirmed) return;

        await supabase.auth.signOut();

        navigate("/");
    }

    // =========================
    // ACTIVE NAVBAR
    // =========================
    function active(path) {
        return location.pathname === path
            ? "nav-link active fw-bold text-white"
            : "nav-link text-white";
    }

    return (

        <nav className="navbar navbar-expand-lg navbar-dark shadow">

            <div className="container-fluid">

                {/* =========================
                    LOGO / BRAND
                ========================= */}
                <Link
                    className="navbar-brand fw-bold d-flex align-items-center"
                    to="/dashboard"
                >

                    <img
                        src={logo}
                        alt="Playtopia Logo"
                        className="playtopia-logo"
                    />

                    <span>
                        Playtopia Rating
                    </span>

                </Link>


                {/* =========================
                    MOBILE BUTTON
                ========================= */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarMenu"
                    aria-controls="navbarMenu"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >

                    <span className="navbar-toggler-icon"></span>

                </button>


                {/* =========================
                    NAVIGATION
                ========================= */}
                <div
                    className="collapse navbar-collapse"
                    id="navbarMenu"
                >

                    <ul className="navbar-nav me-auto">

                        {/* DASHBOARD */}
                        <li className="nav-item">

                            <Link
                                to="/dashboard"
                                className={active("/dashboard")}
                            >

                                <i className="bi bi-speedometer2 me-2"></i>

                                Dashboard

                            </Link>

                        </li>


                        {/* KARYAWAN */}
                        <li className="nav-item">

                            <Link
                                to="/employees"
                                className={active("/employees")}
                            >

                                <i className="bi bi-people-fill me-2"></i>

                                Karyawan

                            </Link>

                        </li>


                        {/* PENILAIAN */}
                        <li className="nav-item">

                            <Link
                                to="/assessment"
                                className={active("/assessment")}
                            >

                                <i className="bi bi-clipboard-data me-2"></i>

                                Penilaian

                            </Link>

                        </li>


                        {/* RANKING */}
                        <li className="nav-item">

                            <Link
                                to="/ranking"
                                className={active("/ranking")}
                            >

                                <i className="bi bi-trophy-fill me-2"></i>

                                Ranking

                            </Link>

                        </li>


                        {/* GRAFIK */}
                        <li className="nav-item">

                            <Link
                                to="/grafik"
                                className={active("/grafik")}
                            >

                                <i className="bi bi-bar-chart-fill me-2"></i>

                                Grafik

                            </Link>

                        </li>

                    </ul>


                    {/* =========================
                        LOGOUT
                    ========================= */}
                    <button
                        className="btn btn-light rounded-pill px-4 fw-semibold"
                        onClick={logout}
                    >

                        <i className="bi bi-box-arrow-right me-2"></i>

                        Logout

                    </button>

                </div>

            </div>

        </nav>
    );
}