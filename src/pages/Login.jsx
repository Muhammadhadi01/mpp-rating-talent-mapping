import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    async function login(e) {

        e.preventDefault();

        const cleanEmail = email.trim();

        if (!cleanEmail || !password) {
            Swal.fire({
                icon: "warning",
                title: "Data belum lengkap",
                text: "Masukkan email dan password terlebih dahulu."
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password
            });

            if (error) {
                console.error("Supabase login error:", error);
                Swal.fire({
                    icon: "error",
                    title: "Login Gagal",
                    text: error.message || "Email atau password tidak benar."
                });
                return;
            }

            await Swal.fire({
                icon: "success",
                title: "Login Berhasil",
                timer: 900,
                showConfirmButton: false
            });

            navigate("/dashboard", { replace: true });
        } catch (err) {
            console.error("Network/Supabase error:", err);

            const message = err?.message || "Tidak dapat terhubung ke server Supabase.";

            Swal.fire({
                icon: "error",
                title: "Koneksi ke Supabase Gagal",
                html: `Tidak dapat menghubungi server Supabase.<br><small>${message}</small><br><br><b>Periksa internet, VITE_SUPABASE_URL, dan VITE_SUPABASE_ANON_KEY.</b>`
            });
        } finally {
            setLoading(false);
        }
    }

    return (

        <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100vh", background: "#f5f5f5" }}
        >

            <div className="card shadow p-4" style={{ width: 400 }}>

                <h3 className="text-center mb-4">

                    MPP Rating

                </h3>

                <form onSubmit={login}>

                    <input
                        className="form-control mb-3"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        className="form-control mb-3"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >

                        {loading ? "Loading..." : "Login"}

                    </button>

                </form>

            </div>

        </div>

    );

}