import { redirect } from "next/navigation";

const VALID_SLUGS = ["standard", "deep", "move-in-out", "airbnb", "carpet"];
const STEPS = ["plan", "time", "crew", "final"];

type Params = {
  slug: string;
  step: string;
};

export default function BookingStepPage({
  params,
}: {
  params: Params;
}) {
  const { slug, step } = params;

  // Safety check
  if (!slug || !step) {
    redirect("/booking/standard/plan");
  }

  // Validate service
  if (!VALID_SLUGS.includes(slug)) {
    redirect("/booking/standard/plan");
  }

  // Validate step
  if (!STEPS.includes(step)) {
    redirect(`/booking/${slug}/plan`);
  }

  // ✅ Valid route → allow rendering
  return null;
}
