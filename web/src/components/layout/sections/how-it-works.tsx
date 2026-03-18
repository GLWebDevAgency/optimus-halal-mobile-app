"use client";

import { benefits } from "@/@data/benefits";
import { SectionContainer } from "@/components/layout/section-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function HowItWorks() {
  return (
    <SectionContainer id="comment-ca-marche">
      <SectionHeader
        subTitle="COMMENT ÇA MARCHE"
        title="Simple comme 1, 2, 3"
      />

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        {/* Left column — sticky description */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-lg text-muted-foreground">
              Naqiy simplifie ta vie quotidienne. En quelques secondes, tu sais
              exactement ce que tu manges et pourquoi.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Chaque étape est pensée pour te donner confiance, transparence et
              contrôle sur ton alimentation halal.
            </p>
          </motion.div>
        </div>

        {/* Right column — benefit cards */}
        <div className="flex flex-col gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const stepNumber = String(index + 1).padStart(2, "0");

            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "transition-all duration-300",
                    "hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="border-gold/30 bg-gold/5 text-gold font-mono text-xs"
                      >
                        {stepNumber}
                      </Badge>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="mt-2">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
