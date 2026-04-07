import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash, ShieldCheck, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Suppression de compte — Naqiy",
  description:
    "Supprimez votre compte Naqiy+ et toutes les données associées. Procédure complète conforme RGPD.",
  alternates: {
    canonical: "https://naqiy.app/suppression-compte",
  },
};

export default function SuppressionComptePage() {
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
        Supprimer mon compte Naqiy+
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Conformément au RGPD, vous pouvez supprimer votre compte et toutes
        vos données à tout moment.
      </p>

      <div className="prose prose-neutral mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_li]:leading-relaxed">
        <h2>1. Suppression depuis l&apos;application (recommandé)</h2>
        <p>
          La méthode la plus simple et rapide pour supprimer votre compte
          Naqiy+ se fait directement depuis l&apos;application :
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Ouvrez l&apos;application Naqiy sur votre appareil</li>
          <li>
            Allez dans l&apos;onglet <strong>Profil</strong> (en bas à droite)
          </li>
          <li>
            Faites défiler jusqu&apos;à la section <strong>Compte</strong>
          </li>
          <li>
            Appuyez sur <strong>Supprimer mon compte</strong>
          </li>
          <li>Confirmez votre choix dans la boîte de dialogue</li>
        </ol>
        <p>
          La suppression est <strong>immédiate et irréversible</strong>.
        </p>

        <h2>2. Suppression par e-mail</h2>
        <p>
          Si vous n&apos;avez plus accès à l&apos;application, vous pouvez
          demander la suppression de votre compte en envoyant un e-mail à :
        </p>
        <p>
          <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
            dpo@naqiy.app
          </a>
        </p>
        <p>
          Précisez l&apos;adresse e-mail associée à votre compte Naqiy+. Notre
          équipe traitera votre demande sous <strong>72 heures ouvrées</strong>.
        </p>

        <h2>3. Données supprimées</h2>
        <p>
          Lorsque vous supprimez votre compte, les données suivantes sont
          <strong> définitivement supprimées</strong> de nos serveurs :
        </p>
        <ul>
          <li>Adresse e-mail et nom d&apos;affichage</li>
          <li>Préférences alimentaires et religieuses (madhab, allergènes, profil santé)</li>
          <li>Historique de scan et statistiques personnelles</li>
          <li>Favoris produits et magasins synchronisés</li>
          <li>Tokens d&apos;authentification et sessions actives</li>
          <li>Données de géolocalisation enregistrées</li>
          <li>Informations de gamification (niveau, badges, série de scans)</li>
        </ul>

        <h2>4. Données conservées</h2>
        <p>
          Pour des raisons légales et de sécurité, certaines données peuvent
          être conservées de manière <strong>anonymisée</strong> :
        </p>
        <ul>
          <li>
            <strong>Logs serveur anonymisés</strong> : 30 jours maximum (lutte
            contre la fraude, débogage)
          </li>
          <li>
            <strong>Données de facturation</strong> : 10 ans (obligation
            comptable et fiscale, code de commerce art. L123-22)
          </li>
          <li>
            <strong>Événements d&apos;abonnement</strong> : conservés sans lien
            avec votre identité, à des fins de statistiques agrégées
          </li>
        </ul>
        <p>
          Aucune de ces données conservées ne permet de vous ré-identifier.
        </p>

        <h2>5. Abonnement Naqiy+ actif</h2>
        <p>
          Si votre compte est associé à un abonnement Naqiy+ actif, sa
          suppression ne résilie <strong>pas automatiquement</strong>{" "}
          l&apos;abonnement auprès du Play Store ou de l&apos;App Store.
        </p>
        <p>
          Vous devez résilier votre abonnement séparément :
        </p>
        <ul>
          <li>
            <strong>Android (Google Play)</strong> :{" "}
            <a
              href="https://play.google.com/store/account/subscriptions"
              className="text-gold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gérer mes abonnements
            </a>
          </li>
          <li>
            <strong>iOS (App Store)</strong> : Réglages → [Votre nom] →
            Abonnements → Naqiy+ → Annuler l&apos;abonnement
          </li>
        </ul>

        <h2>6. Demande de suppression partielle</h2>
        <p>
          Vous pouvez également demander la suppression d&apos;une partie
          uniquement de vos données (par exemple votre historique de scans)
          sans supprimer votre compte. Voir notre page{" "}
          <Link href="/suppression-donnees" className="text-gold hover:underline">
            Suppression de données
          </Link>
          .
        </p>

        <h2>7. Vos droits RGPD</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données
          (RGPD) et à la loi française Informatique et Libertés, vous disposez
          des droits suivants :
        </p>
        <ul>
          <li>Droit d&apos;accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
          <li>Droit à la portabilité de vos données</li>
          <li>Droit d&apos;opposition au traitement</li>
          <li>Droit d&apos;introduire une réclamation auprès de la CNIL</li>
        </ul>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <Trash className="size-6 text-gold" />
          <h3 className="mt-3 font-display text-lg font-bold">
            Suppression immédiate
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Depuis l&apos;app : Profil → Compte → Supprimer mon compte
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <EnvelopeSimple className="size-6 text-gold" />
          <h3 className="mt-3 font-display text-lg font-bold">Par e-mail</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Écrivez à{" "}
            <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
              dpo@naqiy.app
            </a>{" "}
            — réponse sous 72h.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6">
        <ShieldCheck className="size-6 text-gold" />
        <p className="mt-3 text-sm text-muted-foreground">
          Naqiy ne vend, ne loue, ni ne partage vos données personnelles avec
          des tiers à des fins commerciales. Notre modèle économique repose
          uniquement sur les abonnements Naqiy+. Pour en savoir plus,
          consultez notre{" "}
          <Link href="/confidentialite" className="text-gold hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
