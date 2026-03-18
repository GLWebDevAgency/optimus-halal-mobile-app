"use client";

import { useState } from "react";
import { pricingPlans } from "@/@data/pricing";
import { SectionContainer } from "@/components/layout/section-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AnimatedBackground,
  AnimatedBackgroundItem,
} from "@/components/ui/extras/animated-background";
import { SlidingNumber } from "@/components/ui/extras/sliding-number";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <SectionContainer id="tarifs">
      <SectionHeader
        subTitle="TARIFS"
        title="Choisis ton plan"
      />

      {/* Billing toggle */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center rounded-lg bg-muted p-1">
          <AnimatedBackground
            defaultValue="monthly"
            onValueChange={(value) => setIsAnnual(value === "annual")}
            className="flex rounded-md"
          >
            <AnimatedBackgroundItem
              value="monthly"
              className="rounded-md font-medium"
              activeClassName="text-foreground"
            >
              Mensuel
            </AnimatedBackgroundItem>
            <AnimatedBackgroundItem
              value="annual"
              className="rounded-md font-medium"
              activeClassName="text-foreground"
            >
              Annuel
              <Badge className="ml-1.5 bg-primary/10 text-primary text-[10px]">
                -33%
              </Badge>
            </AnimatedBackgroundItem>
          </AnimatedBackground>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {pricingPlans.map((plan, index) => {
          const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
          const period = isAnnual ? "/an" : "/mois";
          const integerPart = Math.floor(price);
          const decimalPart = Math.round((price - integerPart) * 100);

          return (
            <motion.div
              key={plan.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={cn(plan.isPopular && "md:-mt-4 md:mb-[-16px]")}
            >
              <Card
                className={cn(
                  "relative h-full transition-all duration-300",
                  plan.isPopular
                    ? "border-primary/40 shadow-lg shadow-gold/10 scale-[1.02]"
                    : "hover:border-gold/20"
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Populaire
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4 flex items-baseline justify-center gap-0.5">
                    {price === 0 ? (
                      <span className="text-4xl font-bold">Gratuit</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          <SlidingNumber value={integerPart} />
                        </span>
                        {decimalPart > 0 && (
                          <span className="text-xl font-bold text-muted-foreground">
                            ,
                            <SlidingNumber value={decimalPart} padStart={2} />
                          </span>
                        )}
                        <span className="ml-1 text-lg text-muted-foreground">
                          €{period}
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.isPopular ? "default" : "outline"}
                    className={cn(
                      "mt-4 w-full",
                      plan.isPopular && "bg-primary text-primary-foreground"
                    )}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
