import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

export default function Ranking() {
    const [employees, setEmployees] = useState([]);
    const [open, setOpen] = useState(null);

    useEffect(() => {
        loadRanking();
    }, []);

    async function loadRanking() {
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
                ),
                periods (
                    nama_periode
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.log("Gagal mengambil ranking:", error);
            return;
        }

        const grouped = {};

        data.forEach((item) => {
            const employeeId = item.employee_id;
            const name = item.employees?.nama || "-";

            if (!grouped[employeeId]) {
                grouped[employeeId] = {
                    id: employeeId,
                    fullname: name,
                    position: item.employees?.jabatan || "-",
                    history: []
                };
            }

            const total =
                Number(item.total) ||
                (
                    (
                        Number(item.pf) +
                        Number(item.pt) +
                        Number(item.bv)
                    ) / 3
                );

            let rating;

            if (total >= 90) {
                rating = "Excellent";
            } else if (total >= 80) {
                rating = "Very Good";
            } else if (total >= 70) {
                rating = "Good";
            } else {
                rating = "Need Improvement";
            }

            grouped[employeeId].history.push({
                ...item,
                calculatedTotal: total,
                rating
            });
        });

        setEmployees(Object.values(grouped));
    }

    return (
        <>
            <Navbar />

            <div className="container mt-4">

                <h2 className="fw-bold">
                    Ranking
                </h2>

                <p className="text-muted">
                    History Penilaian Karyawan
                </p>

                {employees.length === 0 ? (
                    <div className="alert alert-info">
                        Belum ada data penilaian.
                    </div>
                ) : (
                    employees.map((emp, index) => (

                        <div
                            className="card shadow mb-3"
                            key={emp.id}
                        >

                            <div
                                className="card-header bg-primary text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    if (open === index) {
                                        setOpen(null);
                                    } else {
                                        setOpen(index);
                                    }
                                }}
                            >

                                <h5 className="mb-0">

                                    {open === index ? "▼" : "▶"}

                                    {" "}

                                    {emp.fullname}

                                </h5>

                                <small>
                                    Posisi : {emp.position}
                                </small>

                            </div>

                            {open === index && (

                                <div className="card-body">

                                    <div className="table-responsive">

                                        <table className="table table-bordered">

                                            <thead className="table-dark">

                                                <tr>
                                                    <th>No</th>
                                                    <th>Tanggal</th>
                                                    <th>Periode</th>
                                                    <th>Performance</th>
                                                    <th>Leadership</th>
                                                    <th>Behavior</th>
                                                    <th>Nilai</th>
                                                    <th>Rating</th>
                                                </tr>

                                            </thead>

                                            <tbody>

                                                {emp.history.map((item, i) => (

                                                    <tr key={item.id}>

                                                        <td>
                                                            {i + 1}
                                                        </td>

                                                        <td>
                                                            {item.created_at
                                                                ? new Date(
                                                                    item.created_at
                                                                ).toLocaleDateString(
                                                                    "id-ID"
                                                                )
                                                                : "-"
                                                            }
                                                        </td>

                                                        <td>
                                                            {item.periods?.nama_periode || "-"}
                                                        </td>

                                                        <td>
                                                            {Number(item.pf).toFixed(1)}%
                                                        </td>

                                                        <td>
                                                            {Number(item.pt).toFixed(1)}%
                                                        </td>

                                                        <td>
                                                            {Number(item.bv).toFixed(1)}%
                                                        </td>

                                                        <td>
                                                            {Number(
                                                                item.calculatedTotal
                                                            ).toFixed(1)}%
                                                        </td>

                                                        <td>

                                                            <span
                                                                className={
                                                                    `badge ${
                                                                        item.calculatedTotal >= 90
                                                                            ? "bg-success"
                                                                            : item.calculatedTotal >= 80
                                                                            ? "bg-primary"
                                                                            : item.calculatedTotal >= 70
                                                                            ? "bg-warning text-dark"
                                                                            : "bg-danger"
                                                                    }`
                                                                }
                                                            >
                                                                {item.rating}
                                                            </span>

                                                        </td>

                                                    </tr>

                                                ))}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                            )}

                        </div>

                    ))
                )}

            </div>
        </>
    );
}