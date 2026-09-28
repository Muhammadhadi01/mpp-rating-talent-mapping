import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SessionTimeout from "../components/SessionTimeout";

export default function ProtectedRoute({ children }) {

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        let mounted = true;

        async function getSession() {

            const {
                data,
                error
            } = await supabase.auth.getSession();

            if (error) {
                console.error(
                    "Gagal mengambil session:",
                    error
                );
            }

            if (mounted) {

                setSession(
                    data?.session || null
                );

                setLoading(false);
            }
        }

        getSession();


        // =========================
        // AUTH STATE LISTENER
        // =========================

        const {
            data: authListener
        } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {

                if (!mounted) return;

                setSession(
                    newSession || null
                );

                setLoading(false);
            }
        );


        return () => {

            mounted = false;

            authListener
                ?.subscription
                ?.unsubscribe();

        };

    }, []);


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (
            <div
                className="
                    d-flex
                    justify-content-center
                    align-items-center
                    min-vh-100
                "
            >

                <div className="text-center">

                    <div
                        className="
                            spinner-border
                            text-primary
                            mb-3
                        "
                        role="status"
                    ></div>

                    <div className="fw-semibold text-muted">

                        Memuat aplikasi...

                    </div>

                </div>

            </div>
        );
    }


    // =========================
    // BELUM LOGIN
    // =========================

    if (!session) {

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    // =========================
    // SUDAH LOGIN
    // =========================

    return (
        <>
            <SessionTimeout />

            {children}
        </>
    );
}