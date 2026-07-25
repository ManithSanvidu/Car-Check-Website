import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { AdminStats } from "@/components/admin/admin-stats";
import { ActivityTable } from "@/components/admin/activity-table";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { format, subDays } from "date-fns";

export default async function AdminOverviewPage() {
  const admin = await getCurrentUser(); // role check happens in middleware — see Auth step

  const [totalUsers, totalVehicles, totalReports, recentReports] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.vehicle.count(),
    prisma.scanReport.count(),
    prisma.scanReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { vehicle: true, user: true },
    }),
  ]);

  const reportsNeedingAttention = await prisma.scanReport.count({
    where: {
      createdAt: { gte: subDays(new Date(), 30) },
      checklistItems: { some: { result: "FAIL" } },
    },
  });

  return (
    <DashboardShell variant="admin">
      <Topbar userName={admin.name} onSignOut={() => {}} />
      <main className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide activity across all users and vehicles.
          </p>
        </div>

        <AdminStats
          totalUsers={totalUsers}
          totalVehicles={totalVehicles}
          totalReports={totalReports}
          reportsNeedingAttention={reportsNeedingAttention}
        />

        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Recent Scan Reports</h2>
          <ActivityTable
            rows={recentReports.map((r) => ({
              id: r.id,
              vehicleLabel: `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}`,
              licensePlate: r.vehicle.licensePlate,
              ownerName: r.user.name,
              ownerEmail: r.user.email,
              status: r.status,
              overallScore: r.overallScore,
              createdAt: format(r.createdAt, "dd MMM yyyy"),
              pdfUrl: r.pdfUrl,
            }))}
          />
        </section>
      </main>
    </DashboardShell>
  );
}