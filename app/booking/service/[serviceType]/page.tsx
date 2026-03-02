import { redirect } from 'next/navigation';

export default async function ServiceBookingServicePage({
  params,
}: {
  params: Promise<{ serviceType: string }>;
}) {
  const { serviceType } = await params;
  redirect(`/booking/service/${serviceType}/plan`);
}
