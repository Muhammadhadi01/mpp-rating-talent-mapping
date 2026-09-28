import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RatingCard from "../components/RatingCard";
import RankingTable from "../components/RankingTable";
import { supabase } from "../lib/supabase";
import { getCurrentUserRole } from "../lib/auth";
import Swal from "sweetalert2";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";


export default function Dashboard() {

    // =====================================================
    // STATE
    // =====================================================

    const [periods, setPeriods] = useState([]);

    const [selectedPeriod, setSelectedPeriod] = useState("");

    const [ranking, setRanking] = useState([]);

    const [role, setRole] = useState(null);

    const [showPeriodModal, setShowPeriodModal] = useState(false);

    const [savingPeriod, setSavingPeriod] = useState(false);

    const [periodForm, setPeriodForm] = useState({
        nama_periode: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        status: "Aktif"
    });


    // =====================================================
    // LOAD AWAL
    // =====================================================

    useEffect(() => {

        loadRole();

        loadPeriods();

    }, []);


    // =====================================================
    // LOAD ROLE
    // =====================================================

    async function loadRole() {

        const currentRole = await getCurrentUserRole();

        setRole(currentRole);

    }


    // =====================================================
    // LOAD PERIOD
    // =====================================================

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

            console.error("Gagal mengambil periode:", error);

            return;

        }


        const periodData = data || [];

        setPeriods(periodData);


        if (periodData.length > 0) {

            if (selectLatest) {

                setSelectedPeriod(periodData[0].id);

                loadDashboard(periodData[0].id);

            }

            else if (!selectedPeriod) {

                setSelectedPeriod(periodData[0].id);

                loadDashboard(periodData[0].id);

            }

        }

    }


    // =====================================================
    // CHANGE PERIOD
    // =====================================================

    function handlePeriodChange(event) {

        const periodId = event.target.value;

        setSelectedPeriod(periodId);

        loadDashboard(periodId);

    }


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

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
                    id,
                    nama,
                    jabatan
                )
            `)

            .eq("period_id", periodId)

            .order("created_at", {
                ascending: true
            });


        if (error) {

            console.error(
                "Gagal mengambil data penilaian:",
                error
            );

            setRanking([]);

            return;

        }


        if (!data || data.length === 0) {

            setRanking([]);

            return;

        }


        // =================================================
        // REKAP PER KARYAWAN
        // =================================================

        const employees = {};


        data.forEach((item) => {

            const employeeId = item.employee_id;

            const employeeName =
                item.employees?.nama || "Tanpa Nama";


            if (!employees[employeeId]) {

                employees[employeeId] = {

                    id: employeeId,

                    nama: employeeName,

                    jabatan:
                        item.employees?.jabatan || "-",

                    jumlahInput: 0,

                    pf: 0,

                    pt: 0,

                    bv: 0,

                    total: 0

                };

            }


            employees[employeeId].jumlahInput += 1;


            employees[employeeId].pf +=
                Number(item.pf) || 0;


            employees[employeeId].pt +=
                Number(item.pt) || 0;


            employees[employeeId].bv +=
                Number(item.bv) || 0;


            employees[employeeId].total +=
                Number(item.total) || 0;

        });


        // =================================================
        // HITUNG RATA-RATA
        // =================================================

        const result = Object.values(employees)

            .map((employee) => {

                const jumlah =
                    employee.jumlahInput || 1;


                const averagePF =
                    employee.pf / jumlah;


                const averagePT =
                    employee.pt / jumlah;


                const averageBV =
                    employee.bv / jumlah;


                const averageTotal =
                    employee.total / jumlah;


                let rating = "Need Improvement";


                if (averageTotal >= 90) {

                    rating = "Excellent";

                }

                else if (averageTotal >= 80) {

                    rating = "Very Good";

                }

                else if (averageTotal >= 70) {

                    rating = "Good";

                }


                return {

                    ...employee,

                    averagePF:
                        Number(averagePF.toFixed(1)),

                    averagePT:
                        Number(averagePT.toFixed(1)),

                    averageBV:
                        Number(averageBV.toFixed(1)),

                    averageTotal:
                        Number(averageTotal.toFixed(1)),

                    rating

                };

            })


            .sort(

                (a, b) =>
                    b.averageTotal -
                    a.averageTotal

            );


        setRanking(result);

    }


    // =====================================================
    // TAMBAH PERIODE
    // =====================================================

    function openPeriodModal() {

        if (role !== "admin") return;


        setPeriodForm({

            nama_periode: "",

            tanggal_mulai: "",

            tanggal_selesai: "",

            status: "Aktif"

        });


        setShowPeriodModal(true);

    }


    function closePeriodModal() {

        if (savingPeriod) return;

        setShowPeriodModal(false);

    }


    function handlePeriodFormChange(event) {

        const {
            name,
            value
        } = event.target;


        setPeriodForm((previous) => ({

            ...previous,

            [name]: value

        }));

    }


    async function addPeriod() {

        if (role !== "admin") return;


        if (
            !periodForm.nama_periode ||
            !periodForm.tanggal_mulai ||
            !periodForm.tanggal_selesai
        ) {

            Swal.fire({

                icon: "warning",

                title: "Data belum lengkap",

                text:
                    "Nama periode, tanggal mulai, dan tanggal selesai wajib diisi."

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

                text:
                    "Tanggal selesai tidak boleh sebelum tanggal mulai."

            });

            return;

        }


        setSavingPeriod(true);


        const { error } = await supabase

            .from("periods")

            .insert({

                nama_periode:
                    periodForm.nama_periode,

                tanggal_mulai:
                    periodForm.tanggal_mulai,

                tanggal_selesai:
                    periodForm.tanggal_selesai,

                status:
                    periodForm.status

            });


        setSavingPeriod(false);


        if (error) {

            console.error(
                "Gagal menambah periode:",
                error
            );


            Swal.fire({

                icon: "error",

                title: "Gagal",

                text:
                    "Periode gagal ditambahkan."

            });

            return;

        }


        setShowPeriodModal(false);


        await loadPeriods(true);


        Swal.fire({

            icon: "success",

            title: "Berhasil",

            text:
                "Periode berhasil ditambahkan.",

            timer: 1800,

            showConfirmButton: false

        });

    }


    // =====================================================
    // DATA CHART
    // =====================================================

    const chartData = ranking.map((employee) => ({

        nama: employee.nama,

        Performance: employee.averagePF,

        Potential: employee.averagePT,

        Behavior: employee.averageBV,

        Total: employee.averageTotal

    }));


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <>

            <Navbar />


            <main className="container-fluid px-3 px-md-4 py-4">


                {/* =================================================
                    TITLE
                ================================================= */}

                <div className="dashboard-title mb-4">

                    <h2 className="mb-1">

                        MPP Rating & Talent Mapping

                    </h2>

                    <p className="text-muted mb-0">

                        Sistem penilaian dan pemetaan talent karyawan

                    </p>

                </div>


                {/* =================================================
                    RATING CARDS
                ================================================= */}

                <div className="row g-4 mb-4">


                    {/* PERFORMANCE */}

                    <div className="col-12 col-lg-4">

                        <RatingCard

                            icon="⭐"

                            title="PERFORMANCE (PF)"

                            subtitle=""

                            description="
                                Akurasi transaksi kasir,
                                kepatuhan SOP keselamatan
                                wahana, ketelitian laporan
                                harian, dan kebersihan area
                                kerja.
                            "

                        />

                    </div>


                    {/* POTENTIAL */}

                    <div className="col-12 col-lg-4">

                        <RatingCard

                            icon="⭐"

                            title="POTENTIAL (PT)"

                            subtitle=""

                            description="
                                Kemampuan problem solving
                                saat ada kendala di lapangan,
                                kemauan belajar hal baru,
                                komunikasi antar tim, dan
                                inisiatif mengambil tanggung
                                jawab lebih.
                            "

                        />

                    </div>


                    {/* BEHAVIOR */}

                    <div className="col-12 col-lg-4">

                        <RatingCard

                            icon="⭐"

                            title="BEHAVIOR (BV)"

                            subtitle=""

                            description="
                                Kecepatan dan keramahan
                                pelayanan (hospitality ke
                                customer), kejujuran/integritas
                                (penanganan aset & uang), serta
                                etika menghargai rekan kerja
                                dan atasan.
                            "

                        />

                    </div>

                </div>


                {/* =================================================
                    PERIOD
                ================================================= */}

                <div className="card mb-4">

                    <div className="card-body p-3 p-md-4">


                        <div className="
                            d-flex
                            flex-column
                            flex-md-row
                            justify-content-between
                            align-items-md-center
                            gap-3
                        ">


                            <div>

                                <label
                                    className="
                                        fw-bold
                                        mb-2
                                        d-block
                                    "
                                >

                                    Periode

                                </label>


                                <select

                                    className="form-select period-select"

                                    value={selectedPeriod}

                                    onChange={
                                        handlePeriodChange
                                    }

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


                            {role === "admin" && (

                                <button

                                    type="button"

                                    className="
                                        btn
                                        btn-primary
                                        period-add-button
                                    "

                                    onClick={
                                        openPeriodModal
                                    }

                                >

                                    <i className="
                                        bi
                                        bi-plus-circle
                                        me-2
                                    "></i>

                                    Tambah Periode

                                </button>

                            )}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    RANKING
                ================================================= */}

                <div className="card mb-4">

                    <div className="card-header">

                        <i className="
                            bi
                            bi-trophy-fill
                            me-2
                        "></i>

                        Ranking

                    </div>


                    <div className="card-body">

                        {ranking.length === 0 ? (

                            <div className="
                                text-center
                                text-muted
                                py-5
                            ">

                                <i className="
                                    bi
                                    bi-clipboard-x
                                    display-5
                                    d-block
                                    mb-3
                                "></i>

                                Belum ada data penilaian
                                pada periode ini.

                            </div>

                        ) : (

                            <RankingTable
                                ranking={ranking}
                            />

                        )}

                    </div>

                </div>


                {/* =================================================
                    COMPARISON CHART
                ================================================= */}

                <div className="card mb-4">

                    <div className="card-header">

                        <i className="
                            bi
                            bi-bar-chart-fill
                            me-2
                        "></i>

                        Perbandingan Nilai Karyawan

                    </div>


                    <div className="card-body">

                        {chartData.length === 0 ? (

                            <div className="
                                text-center
                                text-muted
                                py-5
                            ">

                                Belum ada data untuk
                                ditampilkan pada grafik.

                            </div>

                        ) : (

                            <div
                                className="
                                    dashboard-chart
                                "
                            >

                                <ResponsiveContainer
                                    width="100%"
                                    height={400}
                                >

                                    <BarChart
                                        data={chartData}
                                        margin={{
                                            top: 20,
                                            right: 20,
                                            left: 0,
                                            bottom: 70
                                        }}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis

                                            dataKey="nama"

                                            angle={-35}

                                            textAnchor="end"

                                            interval={0}

                                        />

                                        <YAxis
                                            domain={[0, 100]}
                                        />

                                        <Tooltip />

                                        <Legend />

                                        <Bar
                                            dataKey="Performance"
                                            fill="#0057B8"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0
                                            ]}
                                        />

                                        <Bar
                                            dataKey="Potential"
                                            fill="#7B4DFF"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0
                                            ]}
                                        />

                                        <Bar
                                            dataKey="Behavior"
                                            fill="#F72585"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0
                                            ]}
                                        />

                                        <Bar
                                            dataKey="Total"
                                            fill="#2B7FFF"
                                            radius={[
                                                5,
                                                5,
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


            </main>


            {/* =====================================================
                MODAL TAMBAH PERIODE
            ===================================================== */}

            {showPeriodModal && (

                <div
                    className="
                        modal
                        fade
                        show
                        d-block
                        dashboard-modal
                    "
                    tabIndex="-1"
                >

                    <div
                        className="
                            modal-dialog
                            modal-dialog-centered
                        "
                    >

                        <div className="modal-content">


                            <div className="modal-header">

                                <h5 className="modal-title">

                                    <i className="
                                        bi
                                        bi-calendar-plus
                                        me-2
                                    "></i>

                                    Tambah Periode

                                </h5>


                                <button

                                    type="button"

                                    className="btn-close"

                                    onClick={
                                        closePeriodModal
                                    }

                                ></button>

                            </div>


                            <div className="modal-body">


                                {/* NAMA PERIODE */}

                                <div className="mb-3">

                                    <label className="
                                        form-label
                                        fw-semibold
                                    ">

                                        Nama Periode

                                    </label>

                                    <input

                                        type="text"

                                        name="nama_periode"

                                        className="form-control"

                                        placeholder="
                                            Contoh:
                                            Oktober 2026
                                        "

                                        value={
                                            periodForm.nama_periode
                                        }

                                        onChange={
                                            handlePeriodFormChange
                                        }

                                    />

                                </div>


                                {/* TANGGAL MULAI */}

                                <div className="mb-3">

                                    <label className="
                                        form-label
                                        fw-semibold
                                    ">

                                        Tanggal Mulai

                                    </label>

                                    <input

                                        type="date"

                                        name="tanggal_mulai"

                                        className="form-control"

                                        value={
                                            periodForm.tanggal_mulai
                                        }

                                        onChange={
                                            handlePeriodFormChange
                                        }

                                    />

                                </div>


                                {/* TANGGAL SELESAI */}

                                <div className="mb-3">

                                    <label className="
                                        form-label
                                        fw-semibold
                                    ">

                                        Tanggal Selesai

                                    </label>

                                    <input

                                        type="date"

                                        name="tanggal_selesai"

                                        className="form-control"

                                        value={
                                            periodForm.tanggal_selesai
                                        }

                                        onChange={
                                            handlePeriodFormChange
                                        }

                                    />

                                </div>


                                {/* STATUS */}

                                <div className="mb-2">

                                    <label className="
                                        form-label
                                        fw-semibold
                                    ">

                                        Status

                                    </label>

                                    <select

                                        name="status"

                                        className="form-select"

                                        value={
                                            periodForm.status
                                        }

                                        onChange={
                                            handlePeriodFormChange
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

                                    onClick={
                                        closePeriodModal
                                    }

                                    disabled={
                                        savingPeriod
                                    }

                                >

                                    Batal

                                </button>


                                <button

                                    type="button"

                                    className="btn btn-primary"

                                    onClick={
                                        addPeriod
                                    }

                                    disabled={
                                        savingPeriod
                                    }

                                >

                                    {savingPeriod ? (

                                        <>
                                            <span
                                                className="
                                                    spinner-border
                                                    spinner-border-sm
                                                    me-2
                                                "
                                            ></span>

                                            Menyimpan...

                                        </>

                                    ) : (

                                        <>
                                            <i className="
                                                bi
                                                bi-save
                                                me-2
                                            "></i>

                                            Simpan

                                        </>

                                    )}

                                </button>

                            </div>


                        </div>

                    </div>

                </div>

            )}


            {/* MODAL BACKDROP */}

            {showPeriodModal && (

                <div
                    className="
                        modal-backdrop
                        fade
                        show
                    "
                ></div>

            )}

        </>

    );

}