import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Database, EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Suppression de données — Naqiy",
  description:
    "Demandez la suppression d'une partie de vos données Naqiy+ sans supprimer votre compte. Procédure conforme RGPD.",
  alternates: {
    canonical: "https://naqiy.app/suppression-donnees",
  },
};

export default function SuppressionDonneesPage() {
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
        Supprimer mes données
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Vous pouvez supprimer une partie de vos données sans supprimer votre
        compte Naqiy+. Vos préférences et votre abonnement restent intacts.
      </p>

      <div className="prose prose-neutral mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_li]:leading-relaxed">
        <h2>1. Suppression depuis l&apos;application</h2>
        <p>
          La plupart des données peuvent être supprimées directement depuis
          l&apos;application Naqiy, sans contacter le support :
        </p>
        <ul>
          <li>
            <strong>Historique de scan</strong> : Profil → Mes scans → Tout
            effacer
          </li>
          <li>
            <strong>Favoris produits</strong> : Profil → Mes favoris →
            Sélectionner → Supprimer
          </li>
          <li>
            <strong>Favoris magasins</strong> : Profil → Mes magasins favoris →
            Supprimer individuellement
          </li>
          <li>
            <strong>Préférences alimentaires</strong> : Profil → Préférences →
            Réinitialiser
          </li>
          <li>
            <strong>Localisation</strong> : Réglages système → Naqiy →
            Localisation → Désactiver
          </li>
        </ul>

        <h2>2. Demande de suppression spécifique par e-mail</h2>
        <p>
          Pour supprimer des données qui ne sont pas accessibles depuis
          l&apos;application (logs serveur, événements analytiques, etc.),
          envoyez une demande à :
        </p>
        <p>
          <a href="mailto:dpo@naqiy.app" className="text-gold hover:underline">
            dpo@naqiy.app
          </a>
        </p>
        <p>Précisez dans votre demande :</p>
        <ul>
          <li>L&apos;adresse e-mail associée à votre compte Naqiy+</li>
          <li>Les types de données que vous souhaitez supprimer</li>
          <li>La raison de votre demande (facultatif)</li>
        </ul>
        <p>
          Notre équipe traitera votre demande sous{" "}
          <strong>72 heures ouvrées</strong> et vous confirmera la suppression
          par e-mail.
        </p>

        <h2>3. Données pouvant être supprimées</h2>
        <ul>
          <li>Historique de scan complet ou partiel</li>
          <li>Favoris produits et magasins</li>
          <li>Préférences alimentaires et religieuses</li>
          <li>Données de gamification (niveau, badges, série)</li>
          <li>Données de géolocalisation</li>
          <li>Historique d&apos;alertes et boycotts</li>
          <li>Notifications push enregistrées</li>
        </ul>

        <h2>4. Données conservées pour des raisons légales</h2>
        <p>
          Certaines données ne peuvent pas être supprimées immédiatement pour
          des raisons légales ou de sécurité :
        </p>
        <ul>
          <li>
            <strong>Données de facturation</strong> : 10 ans (obligation
            comptable et fiscale, code de commerce art. L123-22)
          </li>
          <li>
            <strong>Logs de sécurité anonymisés</strong> : 30 jours (lutte
            contre la fraude)
          </li>
          <li>
            <strong>Événements d&apos;abonnement</strong> : conservés sans lien
            avec votre identité, à des fins de statistiques agrégées
          </li>
        </ul>

        <h2>5. Vous voulez tout supprimer ?</h2>
        <p>
          Si vous souhaitez supprimer la totalité de vos données ainsi que
          votre compte Naqiy+, consultez notre page{" "}
          <Link href="/suppression-compte" className="text-gold hover:underline">
            Suppression de compte
          </Link>
          .
        </p>

        <h2>6. Vos droits RGPD</h2>
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
          <Database className="size-6 text-gold" />
          <h3 className="mt-3 font-display text-lg font-bold">
            Depuis l&apos;app
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            La plupart des données peuvent être effacées directement dans
            Profil → Préférences ou Mes scans.
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
          des tiers à des fins commerciales. Pour en savoir plus, consultez
          notre{" "}
          <Link href="/confidentialite" className="text-gold hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
