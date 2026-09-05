export default function RankingTable({ data }) {

    return (

        <div className="card shadow mt-4">

            <div className="card-header bg-primary text-white">

                <h5 className="mb-0">
                    RANKING
                </h5>

            </div>

            <div className="card-body">

                <div className="table-responsive">

                    <table className="table table-bordered table-striped">

                        <thead className="table-dark">

                            <tr>

                                <th>No</th>

                                <th>Nama</th>

                                <th>Posisi</th>

                                <th>Total Kerja</th>

                                <th>Performa</th>

                                <th>Leadership</th>

                                <th>Etika</th>

                                <th>Nilai</th>

                                <th>Rating</th>

                            </tr>

                        </thead>

                        <tbody>

                            {data.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="9"
                                        className="text-center"
                                    >
                                        Belum ada data penilaian
                                    </td>

                                </tr>

                            ) : (

                                data.map((item, index) => (

                                    <tr key={item.employeeId || index}>

                                        <td>
                                            {index + 1}
                                        </td>

                                        <td>
                                            {item.fullname}
                                        </td>

                                        <td>
                                            {item.position}
                                        </td>

                                        <td>
                                            {item.totalKerja}
                                        </td>

                                        <td>
                                            {item.performance}
                                        </td>

                                        <td>
                                            {item.leadership}
                                        </td>

                                        <td>
                                            {item.behavior}
                                        </td>

                                        <td>
                                            {item.nilai}
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    `badge ${
                                                        item.rating === "Excellent"
                                                            ? "bg-success"
                                                            : item.rating === "Very Good"
                                                            ? "bg-primary"
                                                            : item.rating === "Good"
                                                            ? "bg-warning text-dark"
                                                            : "bg-danger"
                                                    }`
                                                }
                                            >
                                                {item.rating}
                                            </span>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );
}