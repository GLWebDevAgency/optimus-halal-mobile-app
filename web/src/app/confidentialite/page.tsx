import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description:
    "Politique de confidentialité de l'application Naqiy — comment vos données sont protégées.",
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
        Dernière mise à jour : 25 mars 2026
      </p>

      <div className="prose prose-neutral mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_li]:leading-relaxed">
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est Naqiy, projet indépendant
          basé à Paris, France. Pour toute question relative à la protection de
          vos données, contactez-nous à :{" "}
          <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
            dpo@naqiy.app
          </a>
        </p>

        <h2>2. Notre engagement</h2>
        <p>
          Naqiy est un projet indépendant financé par ses utilisateurs. Nous ne
          vendons aucune donnée personnelle à des tiers. Nous n&apos;affichons
          aucune publicité. Votre confiance est notre seul capital.
        </p>

        <h2>3. Données collectées</h2>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
        <ul>
          <li>
            <strong>Sans compte (mode gratuit) :</strong> aucune donnée
            personnelle. Les scans sont traités localement ou de manière anonyme.
          </li>
          <li>
            <strong>Avec compte (Naqiy+) :</strong> adresse e-mail, préférences
            (école juridique, allergènes, profil santé), historique de scan,
            favoris produits et magasins.
          </li>
          <li>
            <strong>Données techniques :</strong> logs serveur anonymisés,
            version de l&apos;application, type d&apos;appareil (pour le support).
          </li>
        </ul>

        <h2>4. Finalités du traitement</h2>
        <ul>
          <li>Fournir le service de scan et de verdict halal personnalisé</li>
          <li>Synchroniser vos données entre appareils (Naqiy+)</li>
          <li>Améliorer la qualité de notre base de données produits</li>
          <li>Gérer votre abonnement (via RevenueCat)</li>
        </ul>

        <h2>5. Base légale</h2>
        <p>
          Le traitement est fondé sur l&apos;exécution du contrat (fourniture du
          service) et votre consentement pour les fonctionnalités optionnelles.
        </p>

        <h2>6. Durée de conservation</h2>
        <ul>
          <li>Données de compte : conservées tant que le compte est actif, puis supprimées dans les 30 jours suivant la suppression du compte.</li>
          <li>Historique de scan (gratuit) : 7 jours, puis supprimé automatiquement.</li>
          <li>Logs techniques : 90 jours maximum.</li>
        </ul>

        <h2>7. Sous-traitants</h2>
        <ul>
          <li><strong>Railway</strong> (hébergement) — UE</li>
          <li><strong>Cloudflare</strong> (DNS, CDN) — Global, données chiffrées</li>
          <li><strong>RevenueCat</strong> (gestion abonnements) — US, SCCs</li>
          <li><strong>Sentry</strong> (suivi d&apos;erreurs) — US, données anonymisées</li>
          <li><strong>Google Gemini</strong> (analyse IA ingrédients) — données produit uniquement, pas de données personnelles</li>
        </ul>

        <h2>8. Vos droits (RGPD)</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD),
          vous disposez des droits suivants :
        </p>
        <ul>
          <li><strong>Accès :</strong> obtenir une copie de vos données personnelles</li>
          <li><strong>Rectification :</strong> corriger des données inexactes</li>
          <li><strong>Suppression :</strong> demander l&apos;effacement de vos données</li>
          <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
          <li><strong>Opposition :</strong> vous opposer au traitement de vos données</li>
          <li><strong>Limitation :</strong> restreindre le traitement</li>
        </ul>
        <p>
          Pour exercer vos droits, contactez-nous à{" "}
          <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
            dpo@naqiy.app
          </a>
          . Nous répondrons dans un délai de 30 jours.
        </p>

        <h2>9. Sécurité</h2>
        <p>
          Vos données sont chiffrées en transit (TLS 1.3) et au repos. Les mots
          de passe sont hashés avec bcrypt. Les tokens d&apos;authentification
          sont stockés de manière sécurisée (SecureStore sur mobile).
        </p>

        <h2>10. Cookies</h2>
        <p>
          Le site web naqiy.app n&apos;utilise aucun cookie publicitaire ni cookie
          de tracking. Seuls des cookies techniques essentiels au fonctionnement
          du site sont utilisés.
        </p>

        <h2>11. Réclamation</h2>
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
          </a>
          .
        </p>
      </div>
    </main>
  );
}
