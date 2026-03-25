import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions générales d'utilisation de l'application Naqiy — scanner halal gratuit.",
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
        Dernière mise à jour : 25 mars 2026
      </p>

      <div className="prose prose-neutral mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_li]:leading-relaxed">
        <h2>1. Objet</h2>
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent
          l&apos;utilisation de l&apos;application mobile Naqiy (ci-après « l&apos;Application ») éditée
          par Naqiy, projet indépendant basé à Paris, France.
        </p>
        <p>
          L&apos;Application permet aux utilisateurs de scanner des produits alimentaires
          afin d&apos;obtenir un verdict halal personnalisé, un indice de confiance
          (NaqiyScore™) et des informations nutritionnelles détaillées.
        </p>

        <h2>2. Acceptation des CGU</h2>
        <p>
          L&apos;utilisation de l&apos;Application implique l&apos;acceptation pleine et entière
          des présentes CGU. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas
          utiliser l&apos;Application.
        </p>

        <h2>3. Description du service</h2>
        <p>L&apos;Application propose les fonctionnalités suivantes :</p>
        <ul>
          <li>Scan de code-barres et identification de produits alimentaires</li>
          <li>Verdict halal personnalisé selon l&apos;école juridique (madhab) choisie</li>
          <li>NaqiyScore™ — indice de confiance certifieur de 0 à 100</li>
          <li>Analyse nutritionnelle (NutriScore, additifs, indice NOVA)</li>
          <li>Carte des commerces halal certifiés à proximité</li>
        </ul>

        <h2>4. Gratuité et abonnement Naqiy+</h2>
        <p>
          Le scan, le verdict halal et l&apos;analyse IA sont toujours gratuits. L&apos;abonnement
          Naqiy+ (2,99€/mois ou 24,99€/an) débloque des fonctionnalités
          supplémentaires : profil personnalisé, historique illimité, favoris cloud,
          mode hors ligne et profils santé.
        </p>

        <h2>5. Limitation de responsabilité</h2>
        <p>
          Les informations fournies par l&apos;Application sont données à titre indicatif
          et ne constituent en aucun cas un avis religieux (fatwa) ni un conseil
          médical. Naqiy s&apos;efforce de fournir des données exactes mais ne garantit
          pas l&apos;exhaustivité ni l&apos;exactitude des informations affichées.
        </p>
        <p>
          En cas de doute sur le statut halal d&apos;un produit, nous vous recommandons
          de consulter un savant qualifié de votre école juridique.
        </p>

        <h2>6. Données sources</h2>
        <p>
          L&apos;Application s&apos;appuie notamment sur les données d&apos;Open Food Facts
          (licence ODbL), enrichies par notre propre analyse IA et nos
          vérifications manuelles. Les évaluations des certifieurs (NaqiyScore™)
          sont le résultat de nos recherches indépendantes.
        </p>

        <h2>7. Propriété intellectuelle</h2>
        <p>
          La marque Naqiy, le logo, le NaqiyScore™ et l&apos;ensemble des éléments
          graphiques et textuels de l&apos;Application sont la propriété exclusive de
          Naqiy. Toute reproduction, représentation ou exploitation non autorisée
          est strictement interdite.
        </p>

        <h2>8. Modification des CGU</h2>
        <p>
          Naqiy se réserve le droit de modifier les présentes CGU à tout moment.
          Les utilisateurs seront informés de toute modification significative.
          La poursuite de l&apos;utilisation de l&apos;Application vaut acceptation des
          CGU modifiées.
        </p>

        <h2>9. Droit applicable</h2>
        <p>
          Les présentes CGU sont régies par le droit français. Tout litige relatif
          à l&apos;interprétation ou l&apos;exécution des présentes sera soumis aux
          tribunaux compétents de Paris.
        </p>

        <h2>10. Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU, vous pouvez nous
          contacter à l&apos;adresse :{" "}
          <a href="mailto:contact@naqiy.app" className="text-gold hover:underline">
            contact@naqiy.app
          </a>
        </p>
      </div>
    </main>
  );
}
