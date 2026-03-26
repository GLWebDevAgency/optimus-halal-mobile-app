"use client";

import { Flask, BookOpen, Heartbeat } from "@phosphor-icons/react";
import { AnimateIn, Stagger, StaggerItem } from "@/components/animations/animate-in";
import { SplitText } from "@/components/animations/split-text";

const features = [
  {
    icon: Flask,
    title: "E471, lécithine, gélatine — enfin des réponses",
    description:
      "Tu n'as plus à chercher sur Google. Chaque ingrédient est décrypté, expliqué et jugé — pour que tu comprennes vraiment ce que tu achètes.",
    accent: "gold" as const,
  },
{
    icon: Heartbeat,
    title: "Deux scores. Deux exigences.",
    description:
      "Le Naqiy Score juge la licéité halal — certification, traçabilité, indépendance du certifieur. Le Naqiy Score Santé va plus loin : NutriScore, additifs à risque, indice NOVA. Parce que licite n'est pas toujours sain.",
    accent: "leaf" as const,
  },
  {
    icon: BookOpen,
    title: "Chaque verdict a ses sources",
    description:
      "Dalil, avis de savants, références des organismes — tout est transparent. Tu ne nous crois pas sur parole, tu vérifies.",
    accent: "gold" as const,
  },
];

export function AnalysisSection() {
  return (
    <section className="flex items-center bg-gradient-to-b from-background to-secondary/30 py-14 lg:min-h-svh lg:py-20">
      <div className="container max-w-xl">
        <SplitText
          as="h2"
          ssrVisible
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Fini les ingrédients mystérieux
        </SplitText>

        <AnimateIn variant="fadeUp" delay={0.2}>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">
            On est tous passés par là : retourner un paquet, lire une liste incompréhensible, et reposer le produit{" "}
            <span className="font-semibold text-foreground">sans vraiment savoir</span>.
            Allah nous a donné une responsabilité individuelle. Ce verset s&apos;adresse à chacun de nous — pas au voisin, pas au vendeur.{" "}
            <span className="font-semibold text-foreground">À toi.</span>
          </p>

          {/* Quranic verse — pull-quote */}
          <blockquote className="mt-5 border-l-2 border-leaf/30 pl-5">
            <p className="text-lg text-leaf/80 leading-relaxed" lang="ar" dir="rtl">
              «&thinsp;كُلُوا مِمَّا فِي الْأَرْضِ حَلَالًا طَيِّبًا&thinsp;»
            </p>
            <cite className="mt-1.5 block text-sm not-italic text-muted-foreground/60">
              Mangez de ce qui est sur terre, licite et pur — Al-Baqara, 2:168
            </cite>
          </blockquote>

          {/* Hadith on doubt */}
          <blockquote className="mt-4 border-l-2 border-gold/30 pl-5">
            <p className="text-base text-gold/80 leading-relaxed" lang="ar" dir="rtl">
              «&thinsp;دَعْ مَا يَرِيبُكَ إِلَىٰ مَا لَا يَرِيبُكَ&thinsp;»
            </p>
            <cite className="mt-1.5 block text-sm not-italic text-muted-foreground/60">
              Délaisse ce qui te fait douter pour ce qui ne te fait pas douter — At-Tirmidhi
            </cite>
          </blockquote>

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Naqiy t&apos;aide à appliquer ce principe concrètement, au quotidien.
          </p>
        </AnimateIn>

        <Stagger className="mt-6 space-y-2.5">
          {features.map((feature) => {
            const isLeaf = feature.accent === "leaf";
            return (
              <StaggerItem key={feature.title}>
                <div className="group rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <feature.icon
                      className={`size-5 shrink-0 mt-0.5 ${isLeaf ? "text-leaf" : "text-gold"}`}
                      weight="duotone"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{feature.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
