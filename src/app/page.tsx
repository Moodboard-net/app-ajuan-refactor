import { redirect } from "next/navigation";
import { getSession, type Role } from "@/lib/auth";

const roleHome: Record<Role, string> = {
  admin: "/cek-ajuan",
  dirkeu: "/approval",
  divisi: "/ajuan",
};

export default async function Home() {
  const session = await getSession();
  redirect(session ? roleHome[session.role] : "/login");
}
