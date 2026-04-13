import { redirect } from "next/navigation";

const VALID_SLUGS = ["standard", "deep", "move-in-out", "airbnb", "carpet"];
const STEPS = ["plan", "time", "crew", "final"];

export default function Page({ params }: any) {
  const { slug, step } = params;

  if (!VALID_SLUGS.includes(slug)) {
    redirect("/booking/service/standard/plan");
  }

  if (!STEPS.includes(step)) {
    redirect(`/booking/service/${slug}/plan`);
  }

  // ✅ redirect to REAL UI
  redirect(`/booking/service/${slug}/${step}`);
}