import { redirect } from 'next/navigation';

const VALID_SLUGS = ['standard', 'deep', 'move-in-out', 'airbnb', 'carpet'];

export default async function SlugBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug || !VALID_SLUGS.includes(slug)) {
    redirect('/booking/service/standard/plan');
  }
  redirect(`/booking/service/${slug}/plan`);
}
