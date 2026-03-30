import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — Naqiy",
  description:
    "Politique de confidentialité de l'application Naqiy — comment vos données sont collectées, utilisées et protégées.",
  alternates: {
    canonical: "https://naqiy.app/confidentialite",
  },
};

export default function ConfidentialitePage() {
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
        Politique de Confidentialité
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : 28 mars 2026 — Version 2.0
      </p>

      <div className="prose prose-neutral mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_li]:leading-relaxed">
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est <strong>Naqiy</strong>,
          projet indépendant basé à Paris, France. Pour toute question relative
          à la protection de vos données, contactez notre Délégué à la
          Protection des Données :{" "}
          <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
            dpo@naqiy.app
          </a>
        </p>

        <h2>2. Notre engagement</h2>
        <p>
          Naqiy est un projet indépendant financé par ses utilisateurs. Nous ne
          vendons aucune donnée personnelle à des tiers. Nous n&apos;affichons
          aucune publicité. Nous n&apos;utilisons aucun traceur publicitaire ni
          identifiant publicitaire (IDFA/GAID). Votre confiance est notre seul
          capital.
        </p>

        <h2>3. Données collectées</h2>
        <p>
          Nous collectons uniquement les données nécessaires au fonctionnement
          du service, selon votre mode d&apos;utilisation :
        </p>
        <ul>
          <li>
            <strong>Mode invité (gratuit, sans compte) :</strong> aucune donnée
            personnelle. Les scans sont traités localement ou de manière
            anonyme. Quota de 10 scans/jour, 3 favoris locaux maximum.
          </li>
          <li>
            <strong>Période d&apos;essai (7 jours, sans compte) :</strong>{" "}
            aucune donnée personnelle. Toutes les fonctionnalités premium sont
            accessibles. Les données restent stockées localement sur
            l&apos;appareil.
          </li>
          <li>
            <strong>Naqiy+ (abonnement, avec compte) :</strong> adresse e-mail,
            nom d&apos;affichage, préférences alimentaires et religieuses
            (école juridique, allergènes, profil santé), historique de scan,
            favoris produits et magasins.
          </li>
          <li>
            <strong>Données techniques (tous modes) :</strong> logs serveur
            anonymisés, version de l&apos;application, type d&apos;appareil.
          </li>
        </ul>

        <h2>4. Données sensibles</h2>
        <p>
          L&apos;Application peut traiter des données relatives aux convictions
          religieuses (école juridique islamique, niveau de strictesse halal).
          Ces données constituent des données sensibles au sens de l&apos;article
          9 du RGPD. Leur traitement est fondé sur votre consentement explicite,
          recueilli lors de la configuration de vos préférences. Vous pouvez
          retirer ce consentement à tout moment depuis les paramètres de
          l&apos;application.
        </p>

        <h2>5. Données non collectées</h2>
        <p>
          Nous ne collectons <strong>jamais</strong> : vos contacts, vos
          messages, vos informations bancaires (traitées exclusivement par
          Apple/Google via RevenueCat), votre historique de navigation web, vos
          données de santé au sens médical, le contenu de votre appareil photo
          (seul le code-barres scanné est traité), ni vos identifiants
          publicitaires.
        </p>

        <h2>6. Finalités du traitement</h2>
        <ul>
          <li>
            Fournir le service de scan et de verdict halal personnalisé
          </li>
          <li>
            Analyser les ingrédients via intelligence artificielle (Google
            Gemini) — données produit uniquement, pas de données personnelles
          </li>
          <li>Synchroniser vos données entre appareils (Naqiy+)</li>
          <li>Améliorer la qualité de notre base de données produits</li>
          <li>Gérer votre abonnement (via RevenueCat)</li>
          <li>
            Assurer la sécurité du service (détection de fraude, rate limiting)
          </li>
        </ul>

        <h2>7. Base légale</h2>
        <p>
          Le traitement est fondé sur l&apos;exécution du contrat (fourniture du
          service), votre consentement explicite pour les données sensibles
          (convictions religieuses, profil santé), et l&apos;intérêt légitime
          pour les mesures techniques (logs anonymisés, analytics).
        </p>

        <h2>8. Durée de conservation</h2>
        <ul>
          <li>
            <strong>Données de compte Naqiy+ :</strong> conservées tant que le
            compte est actif, puis supprimées dans les 30 jours suivant la
            suppression du compte.
          </li>
          <li>
            <strong>Données locales (mode invité) :</strong> stockées
            uniquement sur l&apos;appareil, pas de conservation serveur.
          </li>
          <li>
            <strong>Historique de scan (Naqiy+) :</strong> 3 ans à compter du
            dernier scan.
          </li>
          <li>
            <strong>Logs techniques :</strong> 90 jours maximum.
          </li>
          <li>
            <strong>Analytics (PostHog) :</strong> 90 jours, hébergement UE.
          </li>
        </ul>

        <h2>9. Sous-traitants</h2>
        <ul>
          <li>
            <strong>Railway</strong> (hébergement serveur) — US, CCT
          </li>
          <li>
            <strong>Cloudflare</strong> (DNS, CDN, stockage images) — Global,
            ISO 27001
          </li>
          <li>
            <strong>Brevo</strong> (emails transactionnels) — France, conforme
            RGPD
          </li>
          <li>
            <strong>RevenueCat</strong> (gestion abonnements) — US, CCT
          </li>
          <li>
            <strong>Sentry</strong> (suivi d&apos;erreurs) — US, données
            anonymisées, SOC 2
          </li>
          <li>
            <strong>PostHog</strong> (analytics) — UE (eu.i.posthog.com),
            conforme RGPD, pas de replay de session
          </li>
          <li>
            <strong>Google Gemini</strong> (analyse IA ingrédients) — données
            produit uniquement, pas de données personnelles
          </li>
          <li>
            <strong>OpenFoodFacts</strong> (base produits) — France, licence
            ODbL
          </li>
          <li>
            <strong>Expo</strong> (mises à jour OTA) — US, CCT
          </li>
          <li>
            <strong>Upstash</strong> (cache Redis) — UE
          </li>
        </ul>
        <p>
          Pour les sous-traitants situés aux États-Unis, les transferts sont
          encadrés par des Clauses Contractuelles Types (CCT) conformément au
          RGPD.
        </p>

        <h2>10. Vos droits (RGPD)</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données, vous
          disposez des droits suivants :
        </p>
        <ul>
          <li>
            <strong>Accès :</strong> obtenir une copie de vos données
            personnelles
          </li>
          <li>
            <strong>Rectification :</strong> corriger des données inexactes
          </li>
          <li>
            <strong>Suppression :</strong> demander l&apos;effacement de vos
            données (Paramètres &gt; Supprimer mon compte)
          </li>
          <li>
            <strong>Portabilité :</strong> recevoir vos données dans un format
            structuré (JSON)
          </li>
          <li>
            <strong>Opposition :</strong> vous opposer au traitement fondé sur
            l&apos;intérêt légitime
          </li>
          <li>
            <strong>Limitation :</strong> restreindre le traitement
          </li>
          <li>
            <strong>Retrait du consentement :</strong> à tout moment depuis les
            paramètres de l&apos;application
          </li>
        </ul>
        <p>
          Pour exercer vos droits, contactez-nous à{" "}
          <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
            dpo@naqiy.app
          </a>
          . Nous répondrons dans un délai de 30 jours.
        </p>

        <h2>11. Sécurité</h2>
        <p>
          Vos données sont chiffrées en transit (TLS 1.3) et au repos
          (AES-256). Les mots de passe sont hashés avec bcrypt (12 rounds). Les
          tokens d&apos;authentification sont stockés de manière sécurisée
          (SecureStore sur mobile). Les codes de réinitialisation sont générés
          par crypto.randomBytes() avec un maximum de 3 tentatives.
        </p>

        <h2>12. Cookies</h2>
        <p>
          L&apos;application mobile n&apos;utilise aucun cookie. Le site web
          naqiy.app n&apos;utilise aucun cookie publicitaire ni cookie de
          tracking. Seuls des cookies techniques essentiels au fonctionnement du
          site sont utilisés. Aucun traceur publicitaire, pixel de suivi ou
          outil de profilage n&apos;est utilisé.
        </p>

        <h2>13. Mineurs</h2>
        <p>
          L&apos;Application n&apos;est pas destinée aux enfants de moins de
          16 ans. Nous ne collectons pas sciemment de données personnelles
          auprès de mineurs.
        </p>

        <h2>14. Réclamation</h2>
        <p>
          Si vous estimez que le traitement de vos données ne respecte pas la
          réglementation, vous pouvez introduire une réclamation auprès de la{" "}
          <a
            href="https://www.cnil.fr/fr/plaintes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            CNIL
          </a>{" "}
          (3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07).
        </p>
      </div>
    </main>
  );
}
