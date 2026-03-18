"use client";

import { stats } from "@/@data/stats";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";

export function Stats() {
  return (
    <section className="container relative z-20 -mt-8">
      <Card className="border-gold/20 bg-card/80 backdrop-blur-md">
        <CardContent>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center gap-1 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <span className="text-3xl font-bold text-gold-gradient sm:text-4xl">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
