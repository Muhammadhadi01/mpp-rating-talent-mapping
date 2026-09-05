import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";
import { getCurrentUserRole } from "../lib/auth";


export default function Employees() {

    const [employees, setEmployees] = useState([]);

    const [positions, setPositions] = useState([]);

    const [nama, setNama] = useState("");

    const [jabatan, setJabatan] = useState("");

    const [search, setSearch] = useState("");

    const [editId, setEditId] = useState(null);

    const [role, setRole] = useState(null);


    // ==========================================
    // LOAD DATA SAAT HALAMAN DIBUKA
    // ==========================================

    useEffect(() => {

        loadRole();

        loadEmployees();

        loadPositions();

    }, []);


    // ==========================================
    // CEK ROLE USER
    // ==========================================

    async function loadRole() {

        const currentRole = await getCurrentUserRole();

        setRole(currentRole);

    }


    // ==========================================
    // LOAD POSISI
    // ==========================================

    async function loadPositions() {

        const { data, error } = await supabase

            .from("positions")

            .select("*")

            .order("name");


        if (error) {

            console.log("Error load positions:", error);

            return;

        }


        setPositions(data || []);

    }


    // ==========================================
    // LOAD KARYAWAN
    // ==========================================

    async function loadEmployees() {

        const { data, error } = await supabase

            .from("employees")

            .select("*")

            .order("nama");


        if (error) {

            console.log("Error load employees:", error);

            return;

        }


        setEmployees(data || []);

    }


    // ==========================================
    // SIMPAN KARYAWAN
    // ADMIN SAJA
    // ==========================================

    async function saveEmployee() {

        // Cek role
        if (role !== "admin") {

            Swal.fire({

                icon: "error",

                title: "Akses Ditolak",

                text: "Anda tidak memiliki izin untuk mengubah data karyawan."

            });

            return;

        }


        // Validasi
        if (!nama || !jabatan) {

            Swal.fire({

                icon: "warning",

                title: "Lengkapi Data",

                text: "Nama dan posisi wajib diisi."

            });

            return;

        }


        // ======================================
        // TAMBAH DATA
        // ======================================

        if (editId === null) {

            const { error } = await supabase

                .from("employees")

                .insert([{

                    nama: nama,

                    jabatan: jabatan

                }]);


            if (error) {

                Swal.fire({

                    icon: "error",

                    title: "Gagal Menambahkan",

                    text: error.message

                });

                return;

            }


            Swal.fire({

                icon: "success",

                title: "Berhasil Ditambahkan",

                timer: 1200,

                showConfirmButton: false

            });

        }


        // ======================================
        // UPDATE DATA
        // ======================================

        else {

            const { error } = await supabase

                .from("employees")

                .update({

                    nama: nama,

                    jabatan: jabatan

                })

                .eq("id", editId);


            if (error) {

                Swal.fire({

                    icon: "error",

                    title: "Gagal Mengupdate",

                    text: error.message

                });

                return;

            }


            Swal.fire({

                icon: "success",

                title: "Berhasil Diupdate",

                timer: 1200,

                showConfirmButton: false

            });

        }


        clearForm();

        loadEmployees();

    }


    // ==========================================
    // RESET FORM
    // ==========================================

    function clearForm() {

        setNama("");

        setJabatan("");

        setEditId(null);

    }


    // ==========================================
    // EDIT KARYAWAN
    // ADMIN SAJA
    // ==========================================

    function editEmployee(item) {

        if (role !== "admin") {

            Swal.fire({

                icon: "error",

                title: "Akses Ditolak",

                text: "Anda tidak memiliki izin untuk mengedit data."

            });

            return;

        }


        setEditId(item.id);

        setNama(item.nama || "");

        setJabatan(item.jabatan || "");


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }


    // ==========================================
    // HAPUS KARYAWAN
    // ADMIN SAJA
    // ==========================================

    async function deleteEmployee(id) {

        if (role !== "admin") {

            Swal.fire({

                icon: "error",

                title: "Akses Ditolak",

                text: "Anda tidak memiliki izin untuk menghapus data."

            });

            return;

        }


        const result = await Swal.fire({

            title: "Hapus karyawan?",

            text: "Data karyawan akan dihapus.",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "Ya, Hapus",

            cancelButtonText: "Batal"

        });


        if (!result.isConfirmed) {

            return;

        }


        const { error } = await supabase

            .from("employees")

            .delete()

            .eq("id", id);


        if (error) {

            Swal.fire({

                icon: "error",

                title: "Gagal Menghapus",

                text: error.message

            });

            return;

        }


        Swal.fire({

            icon: "success",

            title: "Berhasil Dihapus",

            timer: 1000,

            showConfirmButton: false

        });


        loadEmployees();

    }


    // ==========================================
    // SEARCH
    // ==========================================

    const filteredEmployees = employees.filter(item => {

        const namaValue =
            item.nama?.toLowerCase() || "";


        return namaValue.includes(
            search.toLowerCase()
        );

    });


    // ==========================================
    // TAMPILAN
    // ==========================================

    return (

        <>

            <Navbar />


            <div className="container mt-4">


                {/* ==================================
                    FORM TAMBAH / EDIT
                    ADMIN SAJA
                ================================== */}

                {role === "admin" && (

                    <div className="card shadow">


                        <div className="card-header bg-primary text-white">

                            <h4 className="text-white">

                                {editId === null

                                    ? "Tambah Karyawan"

                                    : "Edit Karyawan"

                                }

                            </h4>

                        </div>


                        <div className="card-body">


                            <div className="row">


                                {/* NAMA */}

                                <div className="col-md-7">

                                    <label>

                                        Nama Lengkap

                                    </label>


                                    <input

                                        type="text"

                                        className="form-control"

                                        value={nama}

                                        onChange={(e) =>
                                            setNama(e.target.value)
                                        }

                                        placeholder="Masukkan nama lengkap"

                                    />

                                </div>


                                {/* POSISI */}

                                <div className="col-md-5">

                                    <label>

                                        Posisi

                                    </label>


                                    <select

                                        className="form-select"

                                        value={jabatan}

                                        onChange={(e) =>
                                            setJabatan(e.target.value)
                                        }

                                    >

                                        <option value="">

                                            Pilih Posisi

                                        </option>


                                        {

                                            positions.map(item => (

                                                <option

                                                    key={item.id}

                                                    value={item.name}

                                                >

                                                    {item.name}

                                                </option>

                                            ))

                                        }

                                    </select>

                                </div>


                            </div>


                            {/* TOMBOL */}

                            <button

                                className="btn btn-success mt-3 me-2"

                                onClick={saveEmployee}

                            >

                                Simpan

                            </button>


                            <button

                                className="btn btn-secondary mt-3"

                                onClick={clearForm}

                            >

                                Reset

                            </button>


                        </div>

                    </div>

                )}


                {/* ==================================
                    DATA KARYAWAN
                ================================== */}

                <div className="card shadow mt-4">


                    <div className="card-header">


                        <h4>

                            Data Karyawan

                        </h4>


                        <input

                            type="text"

                            className="form-control mt-2"

                            placeholder="Cari nama"

                            value={search}

                            onChange={(e) =>
                                setSearch(e.target.value)
                            }

                        />

                    </div>


                    <div className="card-body">


                        <div className="table-responsive">


                            <table className="table table-bordered">


                                <thead className="table-dark">

                                    <tr>

                                        <th>

                                            No

                                        </th>


                                        <th>

                                            Nama

                                        </th>


                                        <th>

                                            Posisi

                                        </th>


                                        {role === "admin" && (

                                            <th>

                                                Aksi

                                            </th>

                                        )}

                                    </tr>

                                </thead>


                                <tbody>


                                    {

                                        filteredEmployees.map(

                                            (item, index) => (

                                                <tr

                                                    key={item.id}

                                                >

                                                    {/* NOMOR OTOMATIS */}

                                                    <td>

                                                        {index + 1}

                                                    </td>


                                                    {/* NAMA */}

                                                    <td>

                                                        {item.nama}

                                                    </td>


                                                    {/* POSISI */}

                                                    <td>

                                                        {item.jabatan}

                                                    </td>


                                                    {/* AKSI ADMIN */}

                                                    {role === "admin" && (

                                                        <td>


                                                            <button

                                                                className="btn btn-warning btn-sm me-2"

                                                                onClick={() =>
                                                                    editEmployee(item)
                                                                }

                                                            >

                                                                Edit

                                                            </button>


                                                            <button

                                                                className="btn btn-danger btn-sm"

                                                                onClick={() =>
                                                                    deleteEmployee(item.id)
                                                                }

                                                            >

                                                                Hapus

                                                            </button>


                                                        </td>

                                                    )}

                                                </tr>

                                            )

                                        )

                                    }


                                    {filteredEmployees.length === 0 && (

                                        <tr>

                                            <td

                                                colSpan={
                                                    role === "admin"
                                                        ? 4
                                                        : 3
                                                }

                                                className="text-center"

                                            >

                                                Belum ada data karyawan

                                            </td>

                                        </tr>

                                    )}


                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>


            </div>

        </>

    );

}