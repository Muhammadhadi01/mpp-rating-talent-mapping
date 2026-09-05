import { supabase } from "./supabase";

export async function getCurrentUserRole() {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Gagal mengambil role:", error);
        return null;
    }

    return data?.role || null;
}