import { redirect } from 'next/navigation';

const VALID_SLUGS = ['standard', 'deep', 'move-in-out', 'airbnb', 'carpet'];
const VALID_STEPS = ['plan', 'time', 'crew', 'final'];

export default async function SlugStepBookingPage({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = await params;
  const validSlug = slug && VALID_SLUGS.includes(slug);
  const validStep = step && VALID_STEPS.includes(step);
  if (!validSlug || !validStep) {
    redirect(validSlug ? `/booking/service/${slug}/plan` : '/booking/service/standard/plan');
  }
  redirect(`/booking/service/${slug}/${step}`);
}
