export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dashboard-larger-text">{children}</div>;
}
