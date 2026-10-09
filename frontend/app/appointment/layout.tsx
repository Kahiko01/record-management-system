// This layout isolates the appointment route from global admin UI
export default function AppointmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
