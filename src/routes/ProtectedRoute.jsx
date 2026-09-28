import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {

        async function checkUser() {

            const { data } = await supabase.auth.getSession();

            setSession(data.session);

            setLoading(false);

        }

        checkUser();

    }, []);

    if (loading) {

        return <h3 className="text-center mt-5">Loading...</h3>;

    }

    if (!session) {

        return <Navigate to="/" replace />;

    }

    return children;

}