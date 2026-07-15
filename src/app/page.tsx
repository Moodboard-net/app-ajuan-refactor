import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Role } from "@/types";

const roleHome: Record<Role, string> = {
  admin: "/cek-ajuan",
  dirkeu: "/approval",
  divisi: "/ajuan",
};

export default async function Home() {
  const session = await getSession();
  redirect(session ? roleHome[session.role] : "/login");
}
