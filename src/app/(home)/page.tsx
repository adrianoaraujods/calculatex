import Link from "next/link";

import { GITHUB_URL } from "@/lib/config";
import BackgroundPattern from "@/components/background-pattern";
import FactorizeCard from "@/components/factorize-card";
import { GithubIcon } from "@/components/icon/github-icon";
import { Navbar, NavbarContent } from "@/components/layout/navbar";
import { Section } from "@/components/layout/section";
import { ThemesDropdown } from "@/components/themes-dropdown";
import { Text } from "@/components/typography/text";
import { Button } from "@/components/ui/button";

import { CalculatorIcon } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Navbar>
        <NavbarContent>
          <div className="flex items-center gap-2">
            <CalculatorIcon />

            <Text size="lg">
              Calcu<span className="text-primary font-bold">LaTeX</span>
            </Text>
          </div>

          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
              <Link href={GITHUB_URL} target="_blank">
                <GithubIcon className="size-6" />
              </Link>
            </Button>
            <ThemesDropdown />
          </div>
        </NavbarContent>
      </Navbar>

      <Section className="h-fullitems-center">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <FactorizeCard className="mx-auto w-full max-w-4xl" />
        </div>
      </Section>

      <BackgroundPattern />
    </>
  );
}
