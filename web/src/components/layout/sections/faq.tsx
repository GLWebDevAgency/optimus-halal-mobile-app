"use client";

import { SectionContainer } from "@/components/layout/section-container";
import { SectionHeader } from "@/components/layout/section-header";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/ui/extras/scroll-reveal";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const faqItems = [
  {
    question: "Naqiy est-il vraiment gratuit ?",
    answer:
      "Oui, la version de base est 100% gratuite avec 5 scans par jour. Naqiy+ débloque les scans illimités et les fonctionnalités avancées.",
  },
  {
    question: "Comment le verdict halal est-il calculé ?",
    answer:
      "Notre algorithme croise les données de 12 organismes de certification, l'analyse des ingrédients et additifs, et les avis de sources savantes. Chaque verdict est personnalisé selon votre école juridique.",
  },
  {
    question: "Quelles écoles juridiques sont supportées ?",
    answer:
      "Les quatre écoles sunnites : Hanafi, Maliki, Shafi'i et Hanbali. Le verdict s'adapte aux spécificités de chaque école.",
  },
  {
    question: "D'où viennent les données produits ?",
    answer:
      "Nous combinons la base Open Food Facts (817K+ produits), les données de 12 certifieurs halal, et notre propre enrichissement par IA.",
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer:
      "Absolument. Nous sommes conformes RGPD. Vos données de scan sont chiffrées et ne sont jamais vendues à des tiers.",
  },
  {
    question: "Comment fonctionne le Score Naqiy ?",
    answer:
      "Le Score Naqiy est une note de confiance de 1 à 5, calculée sur trois piliers : les certifications du produit, l'analyse des ingrédients, et les sources savantes islamiques.",
  },
  {
    question: "Puis-je utiliser Naqiy hors ligne ?",
    answer:
      "Le scan nécessite une connexion pour l'analyse en temps réel. Les résultats précédemment consultés sont disponibles hors ligne.",
  },
  {
    question: "Comment signaler un produit incorrect ?",
    answer:
      "Chaque fiche produit dispose d'un bouton de signalement. Notre équipe vérifie chaque rapport sous 48h.",
  },
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function Faq() {
  return (
    <SectionContainer id="faq">
      <ScrollReveal>
        <SectionHeader
          subTitle="FAQ"
          title="Questions fréquentes"
        />
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion>
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium py-5 hover:no-underline hover:text-gold transition-colors">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed pb-2">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollReveal>
    </SectionContainer>
  );
}
