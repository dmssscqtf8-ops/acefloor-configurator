import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency } from "@acefloor/core-engine";
import { ConfiguratorShell } from "../features/configurator/components/configurator-shell";
import {
  catalogProducts,
  getCatalogProductHref,
} from "../features/configurator/data/mock-catalog";
import { getAbsoluteUrl, getSiteOrigin } from "../lib/site";

const siteOrigin = getSiteOrigin();
const canonicalUrl = getAbsoluteUrl("/");
const socialImageUrl = getAbsoluteUrl("/media/acetrax-black.jpeg");

const homeTitle = "Configurateur de tuiles de garage modulaires premium";
const homeDescription =
  "Dessinez un garage, un showroom ou un atelier avec le configurateur AceFloor, comparez les gammes Crown Series, Crown Grip, Crown Cubic et Acetrax, puis estimez rapidement quantites et budget.";

const highlights = [
  {
    title: "Plan interactif orienté vente",
    body:
      "Le visiteur peut dessiner sa surface, ajouter des obstacles, simuler une ouverture de garage et sortir un estimatif plus credible avant de demander une soumission.",
  },
  {
    title: "Catalogue centré sur les bonnes gammes",
    body:
      "Chaque gamme AceFloor est presentee avec son angle d'usage, son poids, son format et sa palette pour aider a choisir plus vite le bon produit.",
  },
  {
    title: "Contenu utile pour l'intention SEO",
    body:
      "La page vise les recherches sur les tuiles de garage modulaires, les dalles premium, les solutions pour showroom automobile et les projets d'atelier sur mesure.",
  },
];

const applications = [
  {
    title: "Garage résidentiel",
    body:
      "Pour transformer un garage standard en espace propre, net et visuellement plus coherent avec le reste de la maison.",
  },
  {
    title: "Showroom automobile",
    body:
      "Pour mettre en scene une collection ou des vehicules clients avec une base plus forte que le beton nu.",
  },
  {
    title: "Atelier et espace technique",
    body:
      "Pour organiser les zones de travail, visualiser les circulations et preparer des projets avec contraintes d'obstacles et d'ouvertures.",
  },
];

const faqs = [
  {
    question: "Le configurateur AceFloor sert-il surtout a vendre ou a dessiner ?",
    answer:
      "Les deux. Il permet de visualiser une surface, de comparer les gammes et de sortir un premier calcul utile pour une demande de soumission plus claire.",
  },
  {
    question: "Peut-on comparer plusieurs motifs de pose avant de choisir ?",
    answer:
      "Oui. Le configurateur propose des presets comme uni, damier, bordure et mode libre pour tester rapidement plusieurs directions visuelles.",
  },
  {
    question: "Quels types de projets sont les plus adaptes aux tuiles modulaires AceFloor ?",
    answer:
      "Les garages residentiels premium, les showrooms, certains ateliers et les espaces ou la qualite percue, la personnalisation et la rapidite de projection commerciale comptent vraiment.",
  },
];

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  keywords: [
    "configurateur tuiles de garage",
    "dalles de garage modulaires",
    "garage flooring tiles canada",
    "revetement garage premium",
    "configurateur revetement garage",
  ],
  openGraph: {
    title: `AceFloor | ${homeTitle}`,
    description: homeDescription,
    url: canonicalUrl ?? undefined,
    images: socialImageUrl
      ? [
          {
            url: socialImageUrl,
            alt: "AceFloor configurateur de tuiles de garage",
          },
        ]
      : undefined,
  },
  twitter: {
    title: `AceFloor | ${homeTitle}`,
    description: homeDescription,
    images: socialImageUrl ? [socialImageUrl] : undefined,
  },
};

export default function Page() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AceFloor",
      description: homeDescription,
      inLanguage: "fr-CA",
      url: canonicalUrl ?? undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AceFloor Configurator",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr-CA",
      description: homeDescription,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "CAD",
      },
      featureList: [
        "dessin de surface garage en 2D",
        "comparaison des gammes AceFloor",
        "estimation de quantite et de prix",
        "motifs de pose et personnalisation couleur",
      ],
      url: canonicalUrl ?? undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Gammes AceFloor",
      itemListElement: catalogProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        description: product.seoDescription,
        url: siteOrigin
          ? new URL(getCatalogProductHref(product), siteOrigin).toString()
          : undefined,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <>
      {structuredData.map((schema, index) => (
        <script
          key={`home-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main>
        <section className="page-shell page-intro page-intro--compact">
          <div className="page-intro-rail">
            <div className="page-intro-copyblock">
              <div className="page-intro-topline">
                <div className="eyebrow">AceFloor Premium</div>
                <span className="page-intro-caption">Configurateur orienté vente</span>
              </div>
              <h1 className="page-intro-title">
                Configurateur de tuiles de garage AceFloor
              </h1>
              <p className="page-intro-copy">
                Dessine le plan, compare les gammes et chiffre un projet premium
                en quelques clics, sans ralentir la vente.
              </p>
              <div className="tag-row page-intro-tags">
                <span className="tag">Residentiel</span>
                <span className="tag">Showroom auto</span>
                <span className="tag">Atelier specialise</span>
              </div>
            </div>

            <div className="page-intro-side">
              <div className="page-intro-logo-lockup">
                <img
                  src="/media/branding/acefloor-gold-logo.png"
                  alt="AceFloor"
                  className="page-intro-brand-image"
                />
                <p className="page-intro-brand-copy">
                  Projection 2D, calcul chantier et brief client dans une meme interface.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ConfiguratorShell />

        <section className="page-shell seo-stack">
          <section className="seo-section" id="gammes">
            <div className="section-intro">
              <h2 className="section-heading">Choisir la bonne gamme AceFloor</h2>
              <p className="section-copy">
                Chaque collection sert une intention differente. Les pages produit
                ci-dessous ouvrent plus de surface SEO tout en donnant un angle clair
                pour les visiteurs prets a comparer des dalles de garage premium.
              </p>
            </div>

            <div className="seo-grid seo-grid--cards">
              {catalogProducts.map((product) => (
                <Link
                  key={product.id}
                  href={getCatalogProductHref(product)}
                  className="seo-card seo-card--link"
                >
                  <span className="seo-card-kicker">Gamme AceFloor</span>
                  <h3>{product.name}</h3>
                  <p>{product.seoDescription}</p>
                  <div className="tag-row">
                    <span className="tag">{formatCurrency(product.pricePerSqFt)} / pi²</span>
                    <span className="tag">{product.tilesPerBox} tuiles / boite</span>
                    <span className="tag">{product.tileWeightGrams} g</span>
                    <span className="tag">{product.idealFor[0]}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="seo-section" id="avantages">
            <div className="section-intro">
              <h2 className="section-heading">
                Un meilleur signal SEO qu'une simple page catalogue
              </h2>
              <p className="section-copy">
                Le site gagne quand il combine un configurateur, des pages produit
                distinctes et un contenu qui repond aux questions d'achat les plus
                frequentes avant meme l'appel commercial.
              </p>
            </div>

            <div className="seo-grid seo-grid--three">
              {highlights.map((highlight) => (
                <article key={highlight.title} className="seo-card">
                  <h3>{highlight.title}</h3>
                  <p>{highlight.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="seo-section" id="applications">
            <div className="section-intro">
              <h2 className="section-heading">
                Requetes ciblees: garage, showroom et atelier
              </h2>
              <p className="section-copy">
                Les pages qui rankent le mieux repondent a un usage clair. AceFloor
                doit donc parler directement des contextes d'installation qui
                convertissent vraiment.
              </p>
            </div>

            <div className="seo-grid seo-grid--three">
              {applications.map((application) => (
                <article key={application.title} className="seo-card">
                  <h3>{application.title}</h3>
                  <p>{application.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="seo-section" id="faq">
            <div className="section-intro">
              <h2 className="section-heading">FAQ avant soumission</h2>
              <p className="section-copy">
                Cette FAQ capte des intentions informationnelles utiles et aide les
                moteurs a comprendre que la page ne se limite pas a un simple outil.
              </p>
            </div>

            <div className="faq-list">
              {faqs.map((faq) => (
                <article key={faq.question} className="seo-card">
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
