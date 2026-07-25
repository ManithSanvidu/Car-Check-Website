import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { UsersTable } from "@/components/admin/users-table";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const admin = await getCurrentUser();
  const query = searchParams.q ?? "";

  const users = await prisma.user.findMany({
    where: {
      role: "USER",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { vehicles: true, scanReports: true } },
    },
  });

  return (
    <DashboardShell variant="admin">
      <Topbar userName={admin.name} onSignOut={() => {}} />
      <main className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {users.length} registered {users.length === 1 ? "user" : "users"}
            </p>
          </div>
          <TableToolbar placeholder="Search by name or email..." />
        </div>

        <UsersTable
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            vehicleCount: u._count.vehicles,
            reportCount: u._count.scanReports,
            joinedAt: format(u.createdAt, "dd MMM yyyy"),
          }))}
        />
      </main>
    </DashboardShell>
  );
}