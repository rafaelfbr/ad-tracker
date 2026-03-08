export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  try {
    if (key) {
      const { data, error } = await supabase
        .schema("adtracker")
        .from("settings")
        .select("value")
        .eq("key", key)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return NextResponse.json({ value: data?.value || "" });
    }

    const { data, error } = await supabase
      .schema("adtracker")
      .from("settings")
      .select("key, value");

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro GET /api/settings:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: "A chave (key) é obrigatória" },
        { status: 400 },
      );
    }

    // Usar upsert para criar ou atualizar
    const { error } = await supabase
      .schema("adtracker")
      .from("settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro POST /api/settings:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 },
    );
  }
}
