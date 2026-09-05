import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

import { supabase } from "../lib/supabase";

export default function Grafik() {

    const navigate = useNavigate();

    const [employees, setEmployees] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [assessments, setAssessments] = useState([]);

    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /*
    ====================================
    LOAD DATA AWAL
    ====================================
    */

    useEffect(() => {

        loadInitialData();

    }, []);

    const loadInitialData = async () => {

        setLoading(true);
        setError("");

        try {

            const [
                employeeResult,
                periodResult
            ] = await Promise.all([

                supabase
                    .from("employees")
                    .select("id, nama, jabatan")
                    .order("nama", {
                        ascending: true
                    }),

                supabase
                    .from("periods")
                    .select(
                        "id, nama_periode, tanggal_mulai, tanggal_selesai, status"
                    )
                    .order("tanggal_mulai", {
                        ascending: false
                    })

            ]);

            if (employeeResult.error) {

                throw employeeResult.error;

            }

            if (periodResult.error) {

                throw periodResult.error;

            }

            const employeeData =
                employeeResult.data || [];

            const periodData =
                periodResult.data || [];

            setEmployees(employeeData);
            setPeriods(periodData);

            /*
            ====================================
            PILIH OTOMATIS
            ====================================
            */

            if (periodData.length > 0) {

                setSelectedPeriod(
                    String(periodData[0].id)
                );

            }

            if (employeeData.length > 0) {

                setSelectedEmployee(
                    String(employeeData[0].id)
                );

            }

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "Gagal mengambil data."
            );

        } finally {

            setLoading(false);

        }
    };

    /*
    ====================================
    LOAD ASSESSMENTS
    ====================================
    */

    useEffect(() => {

        if (
            !selectedEmployee ||
            !selectedPeriod
        ) {

            setAssessments([]);

            return;
        }

        loadAssessments();

    }, [
        selectedEmployee,
        selectedPeriod
    ]);

    const loadAssessments = async () => {

        setError("");

        try {

            const {
                data,
                error
            } = await supabase

                .from("assessments")

                .select(
                    "id, employee_id, period_id, pf, pt, bv, total, created_at"
                )

                .eq(
                    "employee_id",
                    Number(selectedEmployee)
                )

                .eq(
                    "period_id",
                    Number(selectedPeriod)
                )

                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

            if (error) {

                throw error;

            }

            setAssessments(
                data || []
            );

        } catch (err) {

            console.error(err);

            setAssessments([]);

            setError(
                err.message ||
                "Gagal mengambil data penilaian."
            );

        }
    };

    /*
    ====================================
    DATA GRAFIK
    ====================================
    */

    const chartData = useMemo(() => {

        return assessments
            .slice(0, 10)
            .map((item, index) => {

                const performance =
                    Number(item.pf) || 0;

                const leadership =
                    Number(item.pt) || 0;

                const behavior =
                    Number(item.bv) || 0;

                const total =
                    item.total !== null &&
                    item.total !== undefined
                        ? Number(item.total)
                        : (
                            (
                                performance +
                                leadership +
                                behavior
                            ) / 3
                        );

                return {

                    input:
                        `Input ${index + 1}`,

                    performance,

                    leadership,

                    behavior,

                    total:
                        Number(
                            total.toFixed(1)
                        )

                };

            });

    }, [assessments]);

    /*
    ====================================
    EMPLOYEE TERPILIH
    ====================================
    */

    const selectedEmployeeData =
        useMemo(() => {

            return employees.find(
                (employee) =>
                    String(employee.id) ===
                    String(selectedEmployee)
            );

        }, [
            employees,
            selectedEmployee
        ]);

    /*
    ====================================
    PERIODE TERPILIH
    ====================================
    */

    const selectedPeriodData =
        useMemo(() => {

            return periods.find(
                (period) =>
                    String(period.id) ===
                    String(selectedPeriod)
            );

        }, [
            periods,
            selectedPeriod
        ]);

    /*
    ====================================
    RATA-RATA
    ====================================
    */

    const averageData = useMemo(() => {

        if (chartData.length === 0) {

            return {

                performance: 0,
                leadership: 0,
                behavior: 0,
                total: 0

            };

        }

        const count =
            chartData.length;

        const performance =
            chartData.reduce(
                (sum, item) =>
                    sum + item.performance,
                0
            ) / count;

        const leadership =
            chartData.reduce(
                (sum, item) =>
                    sum + item.leadership,
                0
            ) / count;

        const behavior =
            chartData.reduce(
                (sum, item) =>
                    sum + item.behavior,
                0
            ) / count;

        const total =
            chartData.reduce(
                (sum, item) =>
                    sum + item.total,
                0
            ) / count;

        return {

            performance:
                performance.toFixed(1),

            leadership:
                leadership.toFixed(1),

            behavior:
                behavior.toFixed(1),

            total:
                total.toFixed(1)

        };

    }, [chartData]);

    /*
    ====================================
    RATING
    ====================================
    */

    const getRating = (value) => {

        const score =
            Number(value) || 0;

        if (score >= 90)
            return "Excellent";

        if (score >= 80)
            return "Very Good";

        if (score >= 70)
            return "Good";

        return "Need Improvement";
    };

    /*
    ====================================
    FORMAT TANGGAL
    ====================================
    */

    const formatDate = (date) => {

        if (!date)
            return "-";

        return new Date(date)
            .toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );
    };

    /*
    ====================================
    LOADING
    ====================================
    */

    if (loading) {

        return (

            <>
                <Navbar />

                <div className="container-fluid py-4">

                    <div className="text-center py-5">

                        <div
                            className="spinner-border"
                            role="status"
                            style={{
                                width: "3rem",
                                height: "3rem"
                            }}
                        >

                            <span className="visually-hidden">
                                Loading...
                            </span>

                        </div>

                        <p className="mt-3 text-muted">
                            Memuat data grafik...
                        </p>

                    </div>

                </div>
            </>

        );
    }

    return (

        <>
            <Navbar />

            <div className="container-fluid py-4">

                {/* =========================
                    HEADER
                ========================= */}

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div>

                        <h2 className="fw-bold mb-1">
                            Grafik Penilaian
                        </h2>

                        <p className="text-muted mb-0">
                            Perkembangan penilaian karyawan berdasarkan setiap input.
                        </p>

                    </div>



                </div>


                {/* ERROR */}

                {error && (

                    <div
                        className="alert alert-danger"
                        role="alert"
                    >

                        <strong>
                            Gagal:
                        </strong>{" "}

                        {error}

                    </div>

                )}


                {/* =========================
                    FILTER
                ========================= */}

                <div className="card border-0 shadow-sm mb-4">

                    <div className="card-body">

                        <div className="row g-3">

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Pilih Karyawan
                                </label>

                                <select
                                    className="form-select"
                                    value={
                                        selectedEmployee
                                    }
                                    onChange={(e) =>
                                        setSelectedEmployee(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="">
                                        -- Pilih Karyawan --
                                    </option>

                                    {employees.map(
                                        (employee) => (

                                            <option
                                                key={
                                                    employee.id
                                                }
                                                value={
                                                    employee.id
                                                }
                                            >

                                                {employee.nama}

                                                {employee.jabatan
                                                    ? ` - ${employee.jabatan}`
                                                    : ""}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Pilih Periode
                                </label>

                                <select
                                    className="form-select"
                                    value={
                                        selectedPeriod
                                    }
                                    onChange={(e) =>
                                        setSelectedPeriod(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="">
                                        -- Pilih Periode --
                                    </option>

                                    {periods.map(
                                        (period) => (

                                            <option
                                                key={
                                                    period.id
                                                }
                                                value={
                                                    period.id
                                                }
                                            >

                                                {period.nama_periode}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =========================
                    INFORMASI KARYAWAN
                ========================= */}

                {selectedEmployeeData && (

                    <div className="card border-0 shadow-sm mb-4">

                        <div className="card-body">

                            <div className="row align-items-center">

                                <div className="col-md-8">

                                    <h4 className="fw-bold mb-1">
                                        {selectedEmployeeData.nama}
                                    </h4>

                                    <p className="text-muted mb-1">
                                        Posisi:{" "}
                                        {selectedEmployeeData.jabatan || "-"}
                                    </p>

                                    {selectedPeriodData && (

                                        <small className="text-muted">

                                            Periode:{" "}

                                            <strong>
                                                {selectedPeriodData.nama_periode}
                                            </strong>

                                            {" | "}

                                            {formatDate(
                                                selectedPeriodData.tanggal_mulai
                                            )}

                                            {" - "}

                                            {formatDate(
                                                selectedPeriodData.tanggal_selesai
                                            )}

                                        </small>

                                    )}

                                </div>


                                <div className="col-md-4 text-md-end mt-3 mt-md-0">

                                    <span className="badge bg-primary fs-6 px-3 py-2">

                                        {chartData.length} / 10 Input

                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                )}


                {/* =========================
                    RINGKASAN
                ========================= */}

                {chartData.length > 0 && (

                    <div className="row g-3 mb-4">

                        <div className="col-md-3">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body">

                                    <small className="text-muted">
                                        Performance
                                    </small>

                                    <h3 className="fw-bold mt-2 mb-0">
                                        {averageData.performance}
                                    </h3>

                                </div>

                            </div>

                        </div>


                        <div className="col-md-3">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body">

                                    <small className="text-muted">
                                        Leadership
                                    </small>

                                    <h3 className="fw-bold mt-2 mb-0">
                                        {averageData.leadership}
                                    </h3>

                                </div>

                            </div>

                        </div>


                        <div className="col-md-3">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body">

                                    <small className="text-muted">
                                        Behavior
                                    </small>

                                    <h3 className="fw-bold mt-2 mb-0">
                                        {averageData.behavior}
                                    </h3>

                                </div>

                            </div>

                        </div>


                        <div className="col-md-3">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body">

                                    <small className="text-muted">
                                        Total Rata-rata
                                    </small>

                                    <h3 className="fw-bold mt-2 mb-0">
                                        {averageData.total}
                                    </h3>

                                    <span className="badge bg-success mt-2">
                                        {getRating(
                                            averageData.total
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                )}


                {/* =========================
                    GRAFIK
                ========================= */}

                <div className="card border-0 shadow-sm mb-4">

                    <div className="card-body">

                        <div className="mb-4">

                            <h4 className="fw-bold mb-1">
                                Perkembangan Penilaian
                            </h4>

                            <p className="text-muted mb-0">
                                Performance, Leadership,
                                Behavior, dan Total dari
                                setiap input penilaian.
                            </p>

                        </div>


                        {chartData.length === 0 ? (

                            <div className="text-center py-5">

                                <div
                                    className="mb-3"
                                    style={{
                                        fontSize: "3rem"
                                    }}
                                >
                                    📊
                                </div>

                                <h5 className="fw-bold">
                                    Belum Ada Data Penilaian
                                </h5>

                                <p className="text-muted mb-0">
                                    Belum terdapat data penilaian
                                    untuk karyawan dan periode
                                    yang dipilih.
                                </p>

                            </div>

                        ) : (

                            <div
                                style={{
                                    width: "100%",
                                    height: 450
                                }}
                            >

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <LineChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 30,
                                            left: 10,
                                            bottom: 10
                                        }}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis
                                            dataKey="input"
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
                                                Number(value)
                                                    .toFixed(1)
                                            }
                                        />

                                        <Legend />


                                        <Line
                                            type="monotone"
                                            dataKey="performance"
                                            name="Performance"
                                            stroke="#0d6efd"
                                            strokeWidth={3}
                                            dot={{
                                                r: 5
                                            }}
                                            activeDot={{
                                                r: 7
                                            }}
                                        />


                                        <Line
                                            type="monotone"
                                            dataKey="leadership"
                                            name="Leadership"
                                            stroke="#198754"
                                            strokeWidth={3}
                                            dot={{
                                                r: 5
                                            }}
                                            activeDot={{
                                                r: 7
                                            }}
                                        />


                                        <Line
                                            type="monotone"
                                            dataKey="behavior"
                                            name="Behavior"
                                            stroke="#ffc107"
                                            strokeWidth={3}
                                            dot={{
                                                r: 5
                                            }}
                                            activeDot={{
                                                r: 7
                                            }}
                                        />


                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            name="Total"
                                            stroke="#dc3545"
                                            strokeWidth={4}
                                            dot={{
                                                r: 5
                                            }}
                                            activeDot={{
                                                r: 8
                                            }}
                                        />

                                    </LineChart>

                                </ResponsiveContainer>

                            </div>

                        )}

                    </div>

                </div>


                {/* =========================
                    DETAIL
                ========================= */}

                {chartData.length > 0 && (

                    <div className="card border-0 shadow-sm">

                        <div className="card-body">

                            <div className="mb-4">

                                <h4 className="fw-bold mb-1">
                                    Detail Penilaian
                                </h4>

                                <p className="text-muted mb-0">
                                    Riwayat setiap input penilaian karyawan.
                                </p>

                            </div>


                            <div className="table-responsive">

                                <table className="table table-hover align-middle">

                                    <thead className="table-light">

                                        <tr>

                                            <th>No</th>
                                            <th>Input</th>
                                            <th>Performance</th>
                                            <th>Leadership</th>
                                            <th>Behavior</th>
                                            <th>Total</th>
                                            <th>Rating</th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {chartData.map(
                                            (item, index) => (

                                                <tr
                                                    key={
                                                        index
                                                    }
                                                >

                                                    <td>
                                                        {index + 1}
                                                    </td>

                                                    <td>

                                                        <span className="fw-semibold">
                                                            {item.input}
                                                        </span>

                                                    </td>

                                                    <td>
                                                        {item.performance.toFixed(1)}
                                                    </td>

                                                    <td>
                                                        {item.leadership.toFixed(1)}
                                                    </td>

                                                    <td>
                                                        {item.behavior.toFixed(1)}
                                                    </td>

                                                    <td>

                                                        <strong>
                                                            {item.total.toFixed(1)}
                                                        </strong>

                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`badge ${
                                                                item.total >= 90
                                                                    ? "bg-success"
                                                                    : item.total >= 80
                                                                    ? "bg-primary"
                                                                    : item.total >= 70
                                                                    ? "bg-warning text-dark"
                                                                    : "bg-danger"
                                                            }`}
                                                        >

                                                            {getRating(
                                                                item.total
                                                            )}

                                                        </span>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>


                                    <tfoot className="table-light">

                                        <tr>

                                            <th colSpan="2">
                                                Rata-rata
                                            </th>

                                            <th>
                                                {averageData.performance}
                                            </th>

                                            <th>
                                                {averageData.leadership}
                                            </th>

                                            <th>
                                                {averageData.behavior}
                                            </th>

                                            <th>
                                                {averageData.total}
                                            </th>

                                            <th>

                                                <span className="badge bg-success">

                                                    {getRating(
                                                        averageData.total
                                                    )}

                                                </span>

                                            </th>

                                        </tr>

                                    </tfoot>

                                </table>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </>

    );
}