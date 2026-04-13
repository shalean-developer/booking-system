"use client";

import { useParams } from "next/navigation";
import { useStepGuard } from "@/hooks/useStepGuard";

export default function StepGuardClient() {
  const params = useParams();

  const slug = params.serviceType as string;
  const step = params.step as string;

  useStepGuard(step, slug);

  return null;
}