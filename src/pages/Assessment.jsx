import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { getCurrentUserRole } from "../lib/auth";
import Swal from "sweetalert2";

export default function Assessment() {

    // ==========================================
    // STATE
    // ==========================================

    const [employees, setEmployees] = useState([]);
    const [periods, setPeriods] = useState([]);

    const [employeeId, setEmployeeId] = useState("");
    const [periodId, setPeriodId] = useState("");

    const [performance, setPerformance] = useState("");
    const [leadership, setLeadership] = useState("");
    const [behavior, setBehavior] = useState("");

    const [total, setTotal] = useState("0.0");
    const [rating, setRating] = useState("Need Improvement");

    const [loading, setLoading] = useState(true);

    // ROLE
    const [role, setRole] = useState("");

    // ==========================================
    // LOAD DATA SAAT HALAMAN DIBUKA
    // ==========================================

    useEffect(() => {

        loadRole();

        loadData();

    }, []);

    // ==========================================
    // AMBIL ROLE USER
    // ==========================================

    async function loadRole() {

        const currentRole = await getCurrentUserRole();

        console.log("Role user:", currentRole);

        setRole(currentRole || "user");
    }

    // ==========================================
    // HITUNG NILAI OTOMATIS
    // ==========================================

    useEffect(() => {

        hitungNilai();

    }, [
        performance,
        leadership,
        behavior
    ]);

    // ==========================================
    // LOAD SEMUA DATA
    // ==========================================

    async function loadData() {

        setLoading(true);

        await Promise.all([
            loadEmployees(),
            loadPeriods()
        ]);

        setLoading(false);
    }

    // ==========================================
    // LOAD DATA KARYAWAN
    // ==========================================

    async function loadEmployees() {

        const { data, error } = await supabase

            .from("employees")

            .select(`
                id,
                nama,
                jabatan,
                divisi,
                email
            `)

            .order("nama", {
                ascending: true
            });

        if (error) {

            console.log(
                "Error mengambil data karyawan:",
                error
            );

            Swal.fire({

                icon: "error",

                title: "Gagal mengambil data karyawan",

                text: error.message

            });

            return;
        }

        console.log(
            "Data karyawan:",
            data
        );

        setEmployees(data || []);
    }

    // ==========================================
    // LOAD DATA PERIODE
    // ==========================================

    async function loadPeriods() {

        const { data, error } = await supabase

            .from("periods")

            .select(`
                id,
                nama_periode,
                tanggal_mulai,
                tanggal_selesai,
                status,
                created_at
            `)

            .order("tanggal_mulai", {
                ascending: false
            });

        if (error) {

            console.log(
                "Error mengambil data periode:",
                error
            );

            Swal.fire({

                icon: "error",

                title: "Gagal mengambil data periode",

                text: error.message

            });

            return;
        }

        console.log(
            "Data periode:",
            data
        );

        setPeriods(data || []);

        // Pilih periode terbaru otomatis
        if (data && data.length > 0) {

            setPeriodId(data[0].id);

        }
    }

    // ==========================================
    // HITUNG NILAI
    // ==========================================

    function hitungNilai() {

        const p =
            Number(performance) || 0;

        const l =
            Number(leadership) || 0;

        const b =
            Number(behavior) || 0;

        const hasil =
            (p + l + b) / 3;

        setTotal(
            hasil.toFixed(1)
        );

        // ======================================
        // RATING
        // ======================================

        if (hasil >= 90) {

            setRating("Excellent");

        }

        else if (hasil >= 80) {

            setRating("Very Good");

        }

        else if (hasil >= 70) {

            setRating("Good");

        }

        else {

            setRating("Need Improvement");

        }

    }

    // ==========================================
    // SIMPAN PENILAIAN
    // HANYA ADMIN
    // ==========================================

    async function saveAssessment() {

        // Pengaman tambahan di frontend
        if (role !== "admin") {

            Swal.fire({

                icon: "warning",

                title: "Akses ditolak",

                text:
                    "Hanya Admin yang dapat menginput penilaian."

            });

            return;
        }

        // ======================================
        // VALIDASI DATA
        // ======================================

        if (
            !employeeId ||
            !periodId ||
            performance === "" ||
            leadership === "" ||
            behavior === ""
        ) {

            Swal.fire({

                icon: "warning",

                title: "Lengkapi data",

                text:
                    "Periode, karyawan, Performance, Leadership dan Behavior wajib diisi."

            });

            return;
        }

        // ======================================
        // KONVERSI NILAI
        // ======================================

        const nilaiPerformance =
            Number(performance);

        const nilaiLeadership =
            Number(leadership);

        const nilaiBehavior =
            Number(behavior);

        // ======================================
        // CEK ANGKA
        // ======================================

        if (
            isNaN(nilaiPerformance) ||
            isNaN(nilaiLeadership) ||
            isNaN(nilaiBehavior)
        ) {

            Swal.fire({

                icon: "warning",

                title: "Nilai tidak valid",

                text: "Nilai harus berupa angka."

            });

            return;
        }

        // ======================================
        // VALIDASI 0 - 100
        // ======================================

        if (
            nilaiPerformance < 0 ||
            nilaiPerformance > 100 ||

            nilaiLeadership < 0 ||
            nilaiLeadership > 100 ||

            nilaiBehavior < 0 ||
            nilaiBehavior > 100
        ) {

            Swal.fire({

                icon: "warning",

                title: "Nilai tidak valid",

                text:
                    "Nilai Performance, Leadership dan Behavior harus antara 0 sampai 100."

            });

            return;
        }

        // ======================================
        // SIMPAN KE SUPABASE
        // ======================================

        const { error } = await supabase

            .from("assessments")

            .insert([

                {

                    employee_id:
                        Number(employeeId),

                    period_id:
                        periodId,

                    pf:
                        nilaiPerformance,

                    pt:
                        nilaiLeadership,

                    bv:
                        nilaiBehavior

                }

            ]);

        // ======================================
        // CEK ERROR
        // ======================================

        if (error) {

            console.log(
                "Error menyimpan assessment:",
                error
            );

            Swal.fire({

                icon: "error",

                title: "Gagal menyimpan penilaian",

                text: error.message

            });

            return;
        }

        // ======================================
        // BERHASIL
        // ======================================

        Swal.fire({

            icon: "success",

            title: "Berhasil",

            text:
                "Penilaian berhasil disimpan.",

            timer: 1500,

            showConfirmButton: false

        });

        // ======================================
        // RESET FORM
        // ======================================

        setEmployeeId("");

        setPerformance("");

        setLeadership("");

        setBehavior("");

    }

    // ==========================================
    // RESET FORM MANUAL
    // ==========================================

    function resetForm() {

        setEmployeeId("");

        setPerformance("");

        setLeadership("");

        setBehavior("");

    }

    // ==========================================
    // TAMPILAN
    // ==========================================

    return (

        <>

            <Navbar />

            <div className="container mt-4">

                <div className="card shadow">

                    {/* =================================
                        HEADER
                    ================================= */}

                    <div className="card-header bg-primary text-white">

                        <h4 className="mb-0">

                            Input Penilaian Karyawan

                        </h4>

                    </div>

                    <div className="card-body">

                        {/* =================================
                            INFORMASI USER
                        ================================= */}

                        {role === "user" && (

                            <div className="alert alert-info">

                                <strong>Mode View Only</strong>

                                <br />

                                Anda dapat melihat halaman penilaian,
                                tetapi hanya Admin yang dapat
                                menginput penilaian karyawan.

                            </div>

                        )}

                        {/* =================================
                            FORM INPUT
                            HANYA ADMIN
                        ================================= */}

                        {role === "admin" && (

                            <>

                                {/* =================================
                                    PERIODE
                                ================================= */}

                                <label>

                                    Periode

                                </label>

                                <select

                                    className="form-select"

                                    value={periodId}

                                    onChange={(e) =>
                                        setPeriodId(
                                            e.target.value
                                        )
                                    }

                                >

                                    <option value="">

                                        Pilih Periode

                                    </option>

                                    {

                                        periods.map(

                                            (item) => (

                                                <option

                                                    key={item.id}

                                                    value={item.id}

                                                >

                                                    {item.nama_periode}

                                                </option>

                                            )

                                        )

                                    }

                                </select>

                                {

                                    periods.length === 0 && (

                                        <small className="text-danger">

                                            Belum ada data periode.

                                        </small>

                                    )

                                }

                                {/* =================================
                                    KARYAWAN
                                ================================= */}

                                <label className="mt-3">

                                    Karyawan

                                </label>

                                <select

                                    className="form-select"

                                    value={employeeId}

                                    onChange={(e) =>
                                        setEmployeeId(
                                            e.target.value
                                        )
                                    }

                                >

                                    <option value="">

                                        Pilih Karyawan

                                    </option>

                                    {

                                        employees.map(

                                            (item) => (

                                                <option

                                                    key={item.id}

                                                    value={item.id}

                                                >

                                                    {item.nama}

                                                    {

                                                        item.jabatan

                                                            ? ` - ${item.jabatan}`

                                                            : ""

                                                    }

                                                </option>

                                            )

                                        )

                                    }

                                </select>

                                {

                                    employees.length === 0 && (

                                        <small className="text-danger">

                                            Belum ada data karyawan.

                                        </small>

                                    )

                                }

                                {/* =================================
                                    NILAI
                                ================================= */}

                                <div className="row mt-3">

                                    {/* PERFORMANCE */}

                                    <div className="col-md-4">

                                        <label>

                                            Performance %

                                        </label>

                                        <input

                                            type="number"

                                            min="0"

                                            max="100"

                                            className="form-control"

                                            placeholder="0 - 100"

                                            value={performance}

                                            onChange={(e) =>
                                                setPerformance(
                                                    e.target.value
                                                )
                                            }

                                        />

                                    </div>

                                    {/* LEADERSHIP */}

                                    <div className="col-md-4">

                                        <label>

                                            Leadership %

                                        </label>

                                        <input

                                            type="number"

                                            min="0"

                                            max="100"

                                            className="form-control"

                                            placeholder="0 - 100"

                                            value={leadership}

                                            onChange={(e) =>
                                                setLeadership(
                                                    e.target.value
                                                )
                                            }

                                        />

                                    </div>

                                    {/* BEHAVIOR */}

                                    <div className="col-md-4">

                                        <label>

                                            Behavior %

                                        </label>

                                        <input

                                            type="number"

                                            min="0"

                                            max="100"

                                            className="form-control"

                                            placeholder="0 - 100"

                                            value={behavior}

                                            onChange={(e) =>
                                                setBehavior(
                                                    e.target.value
                                                )
                                            }

                                        />

                                    </div>

                                </div>

                                {/* =================================
                                    HASIL NILAI
                                ================================= */}

                                <div className="alert alert-info mt-3">

                                    <div>

                                        Nilai Akhir :

                                        <b>

                                            {" "}

                                            {total}%

                                        </b>

                                    </div>

                                    <div>

                                        Rating :

                                        <b>

                                            {" "}

                                            {rating}

                                        </b>

                                    </div>

                                </div>

                                {/* =================================
                                    BUTTON
                                ================================= */}

                                <button

                                    className="btn btn-success me-2"

                                    onClick={saveAssessment}

                                    disabled={loading}

                                >

                                    Simpan Penilaian

                                </button>

                                <button

                                    className="btn btn-secondary"

                                    onClick={resetForm}

                                >

                                    Reset

                                </button>

                            </>

                        )}

                        {/* =================================
                            JIKA ROLE BELUM TERBACA
                        ================================= */}

                        {!role && (

                            <div className="text-muted">

                                Memuat akses pengguna...

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </>

    );

}