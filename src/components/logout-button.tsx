"use client";

import { logoutAction } from "@/services/userService";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm">
        Keluar
      </Button>
    </form>
  );
}
