import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";


// =====================================================
// SETTING SESSION
// =====================================================

// 30 menit tanpa aktivitas
const INACTIVITY_LIMIT = 30 * 60 * 1000;

// Peringatan muncul 5 menit sebelum logout
const WARNING_TIME = 5 * 60 * 1000;

// Key untuk menyimpan waktu aktivitas terakhir
const LAST_ACTIVITY_KEY = "mpp_last_activity";


export default function SessionTimeout() {

    const navigate = useNavigate();

    const timerRef = useRef(null);

    const warningShownRef = useRef(false);

    const updatingActivityRef = useRef(false);


    // =====================================================
    // LOGOUT
    // =====================================================

    async function logout(reason = "timeout") {

        try {

            localStorage.removeItem(
                LAST_ACTIVITY_KEY
            );

            await supabase.auth.signOut();

        } catch (error) {

            console.error(
                "Gagal logout:",
                error
            );

        }


        if (reason === "timeout") {

            await Swal.fire({

                icon: "info",

                title: "Sesi Berakhir",

                text:
                    "Anda tidak menggunakan aplikasi selama 30 menit. Silakan login kembali.",

                confirmButtonText:
                    "Login Kembali",

                confirmButtonColor:
                    "#0057B8",

                allowOutsideClick:
                    false,

                allowEscapeKey:
                    false

            });

        }


        navigate("/", {
            replace: true
        });

    }


    // =====================================================
    // UPDATE AKTIVITAS
    // =====================================================

    function updateActivity() {

        if (updatingActivityRef.current) {
            return;
        }


        updatingActivityRef.current = true;


        localStorage.setItem(
            LAST_ACTIVITY_KEY,
            Date.now().toString()
        );


        warningShownRef.current = false;


        setTimeout(() => {

            updatingActivityRef.current = false;

        }, 5000);

    }


    // =====================================================
    // CEK SESSION
    // =====================================================

    async function checkActivity() {

        const lastActivity =
            Number(
                localStorage.getItem(
                    LAST_ACTIVITY_KEY
                )
            ) || Date.now();


        const now = Date.now();


        const inactiveTime =
            now - lastActivity;


        // =============================================
        // 30 MENIT → LOGOUT
        // =============================================

        if (
            inactiveTime >=
            INACTIVITY_LIMIT
        ) {

            clearInterval(
                timerRef.current
            );


            await logout("timeout");

            return;

        }


        // =============================================
        // 25 MENIT → WARNING
        // =============================================

        const remainingTime =
            INACTIVITY_LIMIT -
            inactiveTime;


        if (
            remainingTime <= WARNING_TIME &&
            !warningShownRef.current
        ) {

            warningShownRef.current = true;


            showWarning();

        }

    }


    // =====================================================
    // WARNING
    // =====================================================

    function showWarning() {

        Swal.fire({

            icon: "warning",

            title: "Sesi Anda Akan Berakhir",

            html: `
                <div style="
                    font-size:15px;
                    line-height:1.7;
                ">
                    Anda sudah tidak melakukan aktivitas
                    dalam beberapa waktu.
                    <br><br>

                    Sesi akan berakhir dalam
                    <strong>5 menit</strong>
                    jika tidak ada aktivitas.
                    <br><br>

                    Klik tombol di bawah untuk
                    tetap menggunakan aplikasi.
                </div>
            `,

            confirmButtonText:
                "Tetap Gunakan Aplikasi",

            confirmButtonColor:
                "#0057B8",

            allowOutsideClick:
                false,

            allowEscapeKey:
                false

        }).then((result) => {

            if (result.isConfirmed) {

                updateActivity();

            }

        });

    }


    // =====================================================
    // INITIAL SETUP
    // =====================================================

    useEffect(() => {

        // =============================================
        // SET AKTIVITAS PERTAMA
        // =============================================

        const existingActivity =
            localStorage.getItem(
                LAST_ACTIVITY_KEY
            );


        if (!existingActivity) {

            localStorage.setItem(
                LAST_ACTIVITY_KEY,
                Date.now().toString()
            );

        }


        // =============================================
        // EVENT USER ACTIVITY
        // =============================================

        const events = [

            "mousedown",

            "mousemove",

            "keydown",

            "scroll",

            "touchstart",

            "click"

        ];


        events.forEach((event) => {

            window.addEventListener(
                event,
                updateActivity
            );

        });


        // =============================================
        // CHECK SETIAP 10 DETIK
        // =============================================

        timerRef.current =
            setInterval(
                checkActivity,
                10000
            );


        // =============================================
        // CHECK SEKALI SAAT LOAD
        // =============================================

        checkActivity();


        // =============================================
        // CLEANUP
        // =============================================

        return () => {

            events.forEach((event) => {

                window.removeEventListener(
                    event,
                    updateActivity
                );

            });


            clearInterval(
                timerRef.current
            );

        };

    }, []);


    // Komponen ini tidak menampilkan UI
    return null;

}