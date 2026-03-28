import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Naqiy",
  description:
    "Conditions générales d'utilisation de l'application Naqiy — scanner halal intelligent.",
  alternates: {
    canonical: "https://naqiy.app/cgu",
  },
};

export default function CGUPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Retour à l&apos;accueil
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Conditions Générales d&apos;Utilisation
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : 28 mars 2026 — Version 2.0
      </p>

      <div className="prose prose-neutral mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_li]:leading-relaxed">
        <h2>1. Objet</h2>
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU
          ») régissent l&apos;utilisation de l&apos;application mobile Naqiy
          (ci-après « l&apos;Application ») éditée par Naqiy, projet
          indépendant basé à Paris, France.
        </p>
        <p>
          L&apos;utilisation de l&apos;Application implique l&apos;acceptation
          pleine et entière des présentes CGU. Si vous n&apos;acceptez pas ces
          conditions, veuillez ne pas utiliser l&apos;Application.
        </p>

        <h2>2. Description du service</h2>
        <p>
          L&apos;Application propose les fonctionnalités suivantes :
        </p>
        <ul>
          <li>
            Scan de code-barres et identification de produits alimentaires
          </li>
          <li>
            Verdict halal personnalisé selon l&apos;école juridique (madhab)
            choisie
          </li>
          <li>
            NaqiyScore — indice de confiance certifieur de 0 à 100
          </li>
          <li>
            Analyse nutritionnelle (NutriScore, additifs, indice NOVA)
          </li>
          <li>
            Analyse des ingrédients par intelligence artificielle (Google
            Gemini)
          </li>
          <li>Carte des commerces halal certifiés à proximité</li>
          <li>Articles éducatifs sur la consommation halal</li>
          <li>
            Profil de santé (allergènes, restrictions, grossesse)
          </li>
        </ul>

        <h2>3. Modes d&apos;accès</h2>
        <p>
          <strong>Mode invité (gratuit, sans compte) :</strong> le scan, le
          verdict halal et l&apos;analyse IA sont toujours gratuits. Quota de
          20 scans/jour, 3 favoris locaux maximum. Aucun compte requis.
        </p>
        <p>
          <strong>Période d&apos;essai (7 jours, sans compte) :</strong> à
          l&apos;issue de l&apos;onboarding, toutes les fonctionnalités premium
          sont accessibles pendant 7 jours. Aucun moyen de paiement requis.
          Aucune donnée personnelle collectée.
        </p>
        <p>
          <strong>Naqiy+ (abonnement premium, avec compte) :</strong> la
          création d&apos;un compte est réservée aux abonnés Naqiy+. Déblocage
          du profil personnalisé, historique illimité, favoris cloud, mode hors
          ligne et profils santé.
        </p>

        <h2>4. Abonnement Naqiy+</h2>
        <p>
          L&apos;abonnement Naqiy+ est disponible à <strong>2,99 €/mois</strong>{" "}
          ou <strong>24,99 €/an</strong> (TTC). Les prix peuvent varier selon le
          pays. Le paiement est géré exclusivement par Apple App Store ou Google
          Play Store — nous n&apos;avons jamais accès à vos informations
          bancaires.
        </p>
        <p>
          L&apos;abonnement se renouvelle automatiquement. Vous pouvez résilier
          à tout moment depuis les paramètres de votre compte Apple ou Google.
          La résiliation prend effet à la fin de la période en cours.
        </p>

        <h2>5. Nature des verdicts</h2>
        <p>
          Les informations fournies par l&apos;Application sont données à titre
          indicatif et ne constituent en aucun cas un avis religieux (fatwa), une
          certification halal officielle, ni un conseil médical.
          L&apos;Application n&apos;est affiliée à aucun organisme religieux.
        </p>
        <p>
          Les analyses reposent sur les données d&apos;Open Food Facts (licence
          ODbL), les informations déclarées par les fabricants, une analyse par
          intelligence artificielle et nos recherches indépendantes. La
          qualification halal d&apos;un produit peut varier selon les écoles
          juridiques. En cas de doute, consultez un savant qualifié de votre
          école.
        </p>

        <h2>6. Propriété intellectuelle</h2>
        <p>
          La marque <strong>Naqiy</strong>, le logo et le{" "}
          <strong>NaqiyScore</strong> sont la propriété exclusive de Naqiy.
          Toute reproduction, représentation ou exploitation non autorisée est
          strictement interdite. Les données Open Food Facts restent soumises à
          la licence ODbL.
        </p>

        <h2>7. Obligations de l&apos;utilisateur</h2>
        <p>
          L&apos;utilisateur s&apos;engage à utiliser l&apos;Application
          conformément aux lois en vigueur. Il s&apos;interdit notamment de
          contourner les mesures de sécurité, d&apos;utiliser des systèmes
          automatisés (scrapers, bots), et de publier des contenus diffamatoires
          ou frauduleux.
        </p>

        <h2>8. Limitation de responsabilité</h2>
        <p>
          L&apos;éditeur ne saurait être tenu responsable des décisions prises
          sur la base des informations affichées, des erreurs dans les données
          tierces, des interruptions de service, ni des conséquences de la
          modification d&apos;une certification halal par un organisme tiers.
        </p>

        <h2>9. Suppression de compte</h2>
        <p>
          L&apos;utilisateur peut supprimer son compte à tout moment depuis les
          paramètres de l&apos;Application. La suppression entraîne
          l&apos;effacement des données personnelles dans un délai de 30 jours
          et la perte de l&apos;accès aux fonctionnalités Naqiy+.
          L&apos;Application reste utilisable en mode invité.
        </p>

        <h2>10. Données personnelles</h2>
        <p>
          Le traitement des données personnelles est régi par notre{" "}
          <Link
            href="/confidentialite"
            className="text-gold hover:underline"
          >
            Politique de Confidentialité
          </Link>
          . Pour toute question : {" "}
          <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
            dpo@naqiy.app
          </a>
        </p>

        <h2>11. Modification des CGU</h2>
        <p>
          Naqiy se réserve le droit de modifier les présentes CGU. En cas de
          modification substantielle, un délai de 15 jours sera accordé avant
          l&apos;entrée en vigueur. La poursuite de l&apos;utilisation vaut
          acceptation.
        </p>

        <h2>12. Droit applicable</h2>
        <p>
          Les présentes CGU sont régies par le droit français. En cas de litige,
          les parties s&apos;engagent à rechercher une solution amiable.
          L&apos;utilisateur peut recourir à la{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            plateforme européenne de règlement en ligne des litiges
          </a>
          . À défaut, les tribunaux de Paris sont compétents.
        </p>

        <h2>13. Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU :{" "}
          <a
            href="mailto:contact@naqiy.app"
            className="text-gold hover:underline"
          >
            contact@naqiy.app
          </a>
        </p>
      </div>
    </main>
  );
}
