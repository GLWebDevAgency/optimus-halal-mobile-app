import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Mentions Légales",
  description: "Mentions légales du site naqiy.app.",
};

export default function MentionsLegalesPage() {
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
        Mentions Légales
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : 25 mars 2026
      </p>

      <div className="prose prose-neutral mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_li]:leading-relaxed">
        <h2>Éditeur</h2>
        <p>
          Le site <strong>naqiy.app</strong> est édité par :<br />
          Naqiy — Projet indépendant<br />
          Paris, France<br />
          E-mail :{" "}
          <a href="mailto:contact@naqiy.app" className="text-gold hover:underline">
            contact@naqiy.app
          </a>
        </p>

        <h2>Directeur de la publication</h2>
        <p>Le directeur de la publication est le fondateur du projet Naqiy.</p>

        <h2>Hébergement</h2>
        <p>
          <strong>Site web :</strong> Vercel Inc., 440 N Barranca Avenue #4133,
          Covina, CA 91723, USA —{" "}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            vercel.com
          </a>
        </p>
        <p>
          <strong>API et backend :</strong> Railway Corp., San Francisco, CA, USA —{" "}
          <a
            href="https://railway.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            railway.app
          </a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments constituant le site et l&apos;application
          (textes, graphismes, logiciels, images, logos, icônes, sons, données)
          sont la propriété exclusive de Naqiy ou font l&apos;objet d&apos;une
          autorisation d&apos;utilisation.
        </p>
        <p>
          La marque <strong>Naqiy</strong>, le logo et le{" "}
          <strong>NaqiyScore™</strong> sont des marques déposées ou en cours de
          dépôt. Toute reproduction non autorisée constitue une contrefaçon
          passible de sanctions pénales.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Pour toute information relative à la collecte et au traitement de vos
          données personnelles, veuillez consulter notre{" "}
          <Link href="/confidentialite" className="text-gold hover:underline">
            Politique de Confidentialité
          </Link>
          .
        </p>

        <h2>Données Open Food Facts</h2>
        <p>
          Les données produits sont issues en partie d&apos;
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Open Food Facts
          </a>{" "}
          (licence ODbL). Ces données sont enrichies et vérifiées par les
          systèmes d&apos;analyse de Naqiy.
        </p>

        <h2>Crédits</h2>
        <ul>
          <li>Icônes : Phosphor Icons (licence MIT)</li>
          <li>Typographie : Nunito & Nunito Sans (Google Fonts, licence OFL)</li>
          <li>Framework : Next.js par Vercel</li>
        </ul>
      </div>
    </main>
  );
}
