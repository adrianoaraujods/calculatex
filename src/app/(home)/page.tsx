import FactorizeCard from "@/components/factorize-card";
import { Section } from "@/components/layout/section";

export default function HomePage() {
  return (
    <Section className="flex h-screen items-center">
      <FactorizeCard className="mx-auto w-full max-w-lg" />
    </Section>
  );
}
