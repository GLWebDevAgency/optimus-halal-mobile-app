"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CaretLeft, CaretRight, Star, Quotes } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/extras/scroll-reveal";

const testimonials = [
  {
    name: "Mehdi B.",
    location: "Paris",
    text: "Avant Naqiy, je passais 20 minutes par course à vérifier chaque ingrédient. Maintenant, un scan et c'est réglé. L'app a changé ma façon de faire les courses.",
    rating: 5,
    madhab: "Hanafi",
  },
  {
    name: "Fatima K.",
    location: "Lyon",
    text: "Ce qui me plaît c'est la transparence. Je vois exactement pourquoi un produit est jugé halal ou douteux. Les sources sont traçables. C'est rassurant.",
    rating: 5,
    madhab: "Maliki",
  },
  {
    name: "Youssef A.",
    location: "Marseille",
    text: "La carte des magasins halal est incroyable. J'ai découvert des boutiques certifiées à 5 min de chez moi que je ne connaissais pas. Les avis Google intégrés, c'est top.",
    rating: 5,
    madhab: "Shafi'i",
  },
  {
    name: "Sarah L.",
    location: "Toulouse",
    text: "En tant que convertie, je ne savais pas par où commencer. Naqiy m'a tout simplifié. Les verdicts par école juridique, c'est exactement ce qu'il me fallait.",
    rating: 5,
    madhab: "Hanbali",
  },
  {
    name: "Karim D.",
    location: "Bordeaux",
    text: "Le Score Naqiy est génial. En un coup d'œil je sais si je peux acheter ou pas. Et les alertes de rappel produit m'ont sauvé plus d'une fois.",
    rating: 5,
    madhab: "Hanafi",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const navigate = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent(
        (prev) => (prev + dir + testimonials.length) % testimonials.length
      );
    },
    []
  );

  useEffect(() => {
    const timer = setInterval(() => navigate(1), 6000);
    return () => clearInterval(timer);
  }, [navigate]);

  const t = testimonials[current];

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <ScrollReveal>
          <div className="mx-auto max-w-4xl">
            <p className="mb-12 text-center text-sm font-medium tracking-widest text-gold uppercase">
              Témoignages
            </p>

            <div className="mb-8 flex justify-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
                <Quotes className="size-6 text-gold" />
              </div>
            </div>

            <div className="relative min-h-[220px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-center"
                >
                  <div className="mb-6 flex justify-center gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-gold text-gold" />
                    ))}
                  </div>

                  <blockquote className="mx-auto max-w-2xl text-xl leading-relaxed font-medium text-foreground md:text-2xl">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>

                  <div className="mt-8 flex flex-col items-center gap-1">
                    <p className="text-base font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t.location} · {t.madhab}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                onClick={() => navigate(-1)}
                aria-label="Précédent"
              >
                <CaretLeft className="size-4" />
              </Button>

              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > current ? 1 : -1);
                      setCurrent(i);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-8 bg-gold"
                        : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                    }`}
                    aria-label={`Témoignage ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                onClick={() => navigate(1)}
                aria-label="Suivant"
              >
                <CaretRight className="size-4" />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
