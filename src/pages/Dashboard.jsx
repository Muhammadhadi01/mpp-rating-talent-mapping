import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RatingCard from "../components/RatingCard";
import RankingTable from "../components/RankingTable";
import { supabase } from "../lib/supabase";
import { getCurrentUserRole } from "../lib/auth";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

import Swal from "sweetalert2";

export default function Dashboard() {

    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [ranking, setRanking] = useState([]);

    const [role, setRole] = useState(null);

    const [showPeriodModal, setShowPeriodModal] = useState(false);

    const [periodForm, setPeriodForm] = useState({
        nama_periode: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        status: "Aktif"
    });

    const [savingPeriod, setSavingPeriod] = useState(false);

    /*
    ====================================
    LOAD AWAL
    ====================================
    */

    useEffect(() => {
        loadRole();
        loadPeriods();
    }, []);

    /*
    ====================================
    LOAD ROLE
    ====================================
    */

    async function loadRole() {

        const currentRole = await getCurrentUserRole();

        setRole(currentRole);
    }

    /*
    ====================================
    LOAD PERIODE
    ====================================
    */

    async function loadPeriods(selectLatest = false) {

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
                "Gagal mengambil periode:",
                error
            );

            return;
        }

        const periodData = data || [];

        setPeriods(periodData);

        /*
        ====================================
        PILIH PERIODE TERBARU
        ====================================
        */

        if (periodData.length > 0) {

            if (
                !selectedPeriod ||
                selectLatest
            ) {

                setSelectedPeriod(
                    periodData[0].id
                );

                loadDashboard(
                    periodData[0].id
                );

            }

        } else {

            setSelectedPeriod("");
            setRanking([]);

        }
    }

    /*
    ====================================
    LOAD DASHBOARD
    ====================================
    */

    async function loadDashboard(periodId) {

        if (!periodId) {

            setRanking([]);

            return;
        }

        const { data, error } = await supabase
            .from("assessments")
            .select(`
                id,
                employee_id,
                period_id,
                pf,
                pt,
                bv,
                total,
                created_at,
                employees (
                    nama,
                    jabatan
                )
            `)
            .eq("period_id", periodId);

        if (error) {

            console.log(
                "Gagal mengambil data dashboard:",
                error
            );

            setRanking([]);

            return;
        }

        if (!data || data.length === 0) {

            setRanking([]);

            return;
        }

        /*
        ====================================
        REKAP SEMUA PENILAIAN
        PER KARYAWAN
        ====================================
        */

        const employees = {};

        data.forEach((item) => {

            const employeeId = item.employee_id;

            if (!employees[employeeId]) {

                employees[employeeId] = {

                    employeeId,

                    fullname:
                        item.employees?.nama || "-",

                    position:
                        item.employees?.jabatan || "-",

                    totalKerja: 0,

                    performance: 0,

                    leadership: 0,

                    behavior: 0,

                    nilai: 0

                };
            }

            /*
            ====================================
            SETIAP INPUT = 1 PENILAIAN
            ====================================
            */

            employees[employeeId].totalKerja++;

            employees[employeeId].performance +=
                Number(item.pf) || 0;

            employees[employeeId].leadership +=
                Number(item.pt) || 0;

            employees[employeeId].behavior +=
                Number(item.bv) || 0;

            /*
            ====================================
            TOTAL SATU INPUT
            ====================================
            */

            const total =
                item.total !== null &&
                item.total !== undefined
                    ? Number(item.total)
                    : (
                        (
                            Number(item.pf) +
                            Number(item.pt) +
                            Number(item.bv)
                        ) / 3
                    );

            employees[employeeId].nilai += total;

        });

        /*
        ====================================
        HITUNG RATA-RATA
        ====================================
        */

        const result = Object.values(employees)
            .map((item) => {

                const avgPerformance =
                    item.performance /
                    item.totalKerja;

                const avgLeadership =
                    item.leadership /
                    item.totalKerja;

                const avgBehavior =
                    item.behavior /
                    item.totalKerja;

                const avgNilai =
                    item.nilai /
                    item.totalKerja;

                let rating;

                if (avgNilai >= 90) {

                    rating = "Excellent";

                } else if (avgNilai >= 80) {

                    rating = "Very Good";

                } else if (avgNilai >= 70) {

                    rating = "Good";

                } else {

                    rating = "Need Improvement";
                }

                return {

                    employeeId:
                        item.employeeId,

                    fullname:
                        item.fullname,

                    position:
                        item.position,

                    totalKerja:
                        item.totalKerja,

                    performance:
                        avgPerformance
                            .toFixed(1) + "%",

                    leadership:
                        avgLeadership
                            .toFixed(1) + "%",

                    behavior:
                        avgBehavior
                            .toFixed(1) + "%",

                    nilai:
                        avgNilai
                            .toFixed(1) + "%",

                    rating

                };

            });

        /*
        ====================================
        SORT NILAI TERTINGGI
        ====================================
        */

        result.sort((a, b) => {

            return (
                parseFloat(b.nilai) -
                parseFloat(a.nilai)
            );

        });

        setRanking(result);
    }

    /*
    ====================================
    TAMBAH PERIODE
    ====================================
    */

    async function addPeriod() {

        if (role !== "admin") {

            return;
        }

        if (
            !periodForm.nama_periode ||
            !periodForm.tanggal_mulai ||
            !periodForm.tanggal_selesai
        ) {

            Swal.fire({
                icon: "warning",
                title: "Data belum lengkap",
                text: "Silakan lengkapi nama periode dan tanggal."
            });

            return;
        }

        if (
            periodForm.tanggal_selesai <
            periodForm.tanggal_mulai
        ) {

            Swal.fire({
                icon: "warning",
                title: "Tanggal tidak valid",
                text: "Tanggal selesai tidak boleh sebelum tanggal mulai."
            });

            return;
        }

        setSavingPeriod(true);

        const { data, error } = await supabase
            .from("periods")
            .insert([
                {
                    nama_periode:
                        periodForm.nama_periode,

                    tanggal_mulai:
                        periodForm.tanggal_mulai,

                    tanggal_selesai:
                        periodForm.tanggal_selesai,

                    status:
                        periodForm.status
                }
            ])
            .select()
            .single();

        setSavingPeriod(false);

        if (error) {

            console.error(
                "Gagal menambahkan periode:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: error.message
            });

            return;
        }

        /*
        ====================================
        RESET FORM
        ====================================
        */

        setPeriodForm({
            nama_periode: "",
            tanggal_mulai: "",
            tanggal_selesai: "",
            status: "Aktif"
        });

        setShowPeriodModal(false);

        /*
        ====================================
        UPDATE PERIODE
        ====================================
        */

        await loadPeriods(true);

        Swal.fire({
            icon: "success",
            title: "Periode berhasil dibuat",
            text: data?.nama_periode || "",
            timer: 1800,
            showConfirmButton: false
        });
    }

    /*
    ====================================
    CHART DATA
    ====================================
    */

    const chartData = ranking.map((item) => {

        return {

            name: item.fullname,

            Performance:
                parseFloat(item.performance),

            Leadership:
                parseFloat(item.leadership),

            Behavior:
                parseFloat(item.behavior),

            Total:
                parseFloat(item.nilai)

        };

    });

    return (

        <>
            <Navbar />

            <div className="container mt-4">

                {/* HEADER */}

                <h2 className="fw-bold">
                    MPP Rating & Talent Mapping
                </h2>


                {/* =========================
                    PERIODE
                ========================= */}

                <div className="mt-4">

                    <div className="d-flex justify-content-between align-items-end mb-2">

                        <label className="fw-bold mb-0">
                            Periode
                        </label>

                        {role === "admin" && (

                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                    setShowPeriodModal(true)
                                }
                            >

                                <i className="bi bi-plus-circle me-2"></i>

                                Tambah Periode

                            </button>

                        )}

                    </div>


                    <select
                        className="form-select"
                        value={selectedPeriod}
                        onChange={(e) => {

                            const periodId =
                                e.target.value;

                            setSelectedPeriod(
                                periodId
                            );

                            loadDashboard(
                                periodId
                            );

                        }}
                    >

                        {periods.length === 0 && (

                            <option value="">
                                Belum ada periode
                            </option>

                        )}

                        {periods.map((period) => (

                            <option
                                key={period.id}
                                value={period.id}
                            >
                                {period.nama_periode}
                            </option>

                        ))}

                    </select>

                </div>


                {/* =========================
                    RATING CARD
                ========================= */}

                <div className="row mt-4">

                    <div className="col-md-4 mb-3">

                       
                    <RatingCard
    icon="⭐"
    title="PERFORMANCE (PF)"
    subtitle="Performance"
    description="Akurasi transaksi kasir, kepatuhan SOP keselamatan wahana, ketelitian laporan harian, dan kebersihan area kerja."
/>

<RatingCard
    icon="👑"
    title="POTENTIAL (PT)"
    subtitle="Potential"
    description="Kemampuan problem solving saat ada kendala di lapangan, kemauan belajar hal baru, komunikasi antar tim, dan inisiatif mengambil tanggung jawab lebih."
/>

<RatingCard
    icon="🤝"
    title="BEHAVIOR (BV)"
    subtitle="Behavior"
    description="Kecepatan dan keramahan pelayanan (hospitality ke customer), kejujuran/integritas (penanganan aset & uang), serta etika menghargai rekan kerja dan atasan."
/>

                    </div>


                    <div className="col-md-4 mb-3">

                        <RatingCard
                            title="ETIKA"
                            subtitle="Tingkah Laku"
                            description="Mengukur sikap kerja, kedisiplinan, tanggung jawab, dan perilaku profesional."
                            icon="⚖️"
                        />

                    </div>

                </div>


                {/* =========================
                    RANKING
                ========================= */}

                <RankingTable
                    data={ranking}
                />


                {/* =========================
                    GRAFIK PERBANDINGAN
                ========================= */}

                <div className="card border-0 shadow-sm mt-4 mb-5">

                    <div className="card-body">

                        <div className="mb-4">

                            <h4 className="fw-bold mb-1">
                                Grafik Perbandingan Karyawan
                            </h4>

                            <p className="text-muted mb-0">
                                Perbandingan nilai rata-rata
                                Performance, Leadership,
                                Behavior, dan Total setiap
                                karyawan pada periode yang dipilih.
                            </p>

                        </div>


                        {chartData.length === 0 ? (

                            <div className="text-center py-5">

                                <div
                                    style={{
                                        fontSize: "3rem"
                                    }}
                                >
                                    📊
                                </div>

                                <h5 className="fw-bold mt-3">
                                    Belum Ada Data
                                </h5>

                                <p className="text-muted mb-0">
                                    Belum terdapat data penilaian
                                    untuk periode yang dipilih.
                                </p>

                            </div>

                        ) : (

                            <div
                                style={{
                                    width: "100%",
                                    height: 500
                                }}
                            >

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <BarChart
                                        data={chartData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 10,
                                            bottom: 80
                                        }}
                                        barGap={4}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis
                                            dataKey="name"
                                            interval={0}
                                            angle={-30}
                                            textAnchor="end"
                                            height={80}
                                            tick={{
                                                fontSize: 12
                                            }}
                                        />

                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{
                                                fontSize: 12
                                            }}
                                        />

                                        <Tooltip
                                            formatter={(value) =>
                                                `${Number(value).toFixed(1)}`
                                            }
                                        />

                                        <Legend />

                                        <Bar
                                            dataKey="Performance"
                                            name="Performance"
                                            fill="#0d6efd"
                                            radius={[
                                                4,
                                                4,
                                                0,
                                                0
                                            ]}
                                        />

                                        <Bar
                                            dataKey="Leadership"
                                            name="Leadership"
                                            fill="#198754"
                                            radius={[
                                                4,
                                                4,
                                                0,
                                                0
                                            ]}
                                        />

                                        <Bar
                                            dataKey="Behavior"
                                            name="Behavior"
                                            fill="#ffc107"
                                            radius={[
                                                4,
                                                4,
                                                0,
                                                0
                                            ]}
                                        />

                                        <Bar
                                            dataKey="Total"
                                            name="Total"
                                            fill="#dc3545"
                                            radius={[
                                                4,
                                                4,
                                                0,
                                                0
                                            ]}
                                        />

                                    </BarChart>

                                </ResponsiveContainer>

                            </div>

                        )}

                    </div>

                </div>

            </div>


            {/* ====================================
                MODAL TAMBAH PERIODE
            ==================================== */}

            {showPeriodModal && role === "admin" && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)"
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title fw-bold">
                                    Tambah Periode
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setShowPeriodModal(false)
                                    }
                                ></button>

                            </div>


                            <div className="modal-body">

                                {/* NAMA PERIODE */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        Nama Periode
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Contoh: September 2026"
                                        value={
                                            periodForm.nama_periode
                                        }
                                        onChange={(e) =>
                                            setPeriodForm({
                                                ...periodForm,
                                                nama_periode:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>


                                {/* TANGGAL MULAI */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        Tanggal Mulai
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={
                                            periodForm.tanggal_mulai
                                        }
                                        onChange={(e) =>
                                            setPeriodForm({
                                                ...periodForm,
                                                tanggal_mulai:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>


                                {/* TANGGAL SELESAI */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        Tanggal Selesai
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={
                                            periodForm.tanggal_selesai
                                        }
                                        onChange={(e) =>
                                            setPeriodForm({
                                                ...periodForm,
                                                tanggal_selesai:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>


                                {/* STATUS */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        Status
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            periodForm.status
                                        }
                                        onChange={(e) =>
                                            setPeriodForm({
                                                ...periodForm,
                                                status:
                                                    e.target.value
                                            })
                                        }
                                    >

                                        <option value="Aktif">
                                            Aktif
                                        </option>

                                        <option value="Selesai">
                                            Selesai
                                        </option>

                                    </select>

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowPeriodModal(false)
                                    }
                                >
                                    Batal
                                </button>


                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={addPeriod}
                                    disabled={savingPeriod}
                                >

                                    {savingPeriod ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                            ></span>

                                            Menyimpan...

                                        </>

                                    ) : (

                                        <>
                                            <i className="bi bi-check-circle me-2"></i>

                                            Simpan Periode
                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </>

    );
}