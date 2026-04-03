import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency, formatDimension } from "@acefloor/core-engine";
import { ConfiguratorShell } from "../../../features/configurator/components/configurator-shell";
import {
  catalogProducts,
  getCatalogColorHex,
  getCatalogProductBySlug,
  getCatalogProductHeroImage,
  getCatalogProductHref,
  type CatalogProduct,
} from "../../../features/configurator/data/mock-catalog";
import { getAbsoluteUrl } from "../../../lib/site";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return catalogProducts.map((product) => ({
    slug: product.slug,
  }));
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = getCatalogProductBySlug(params.slug);

  if (!product) {
    return {};
  }

  const canonicalUrl = getAbsoluteUrl(getCatalogProductHref(product));
  const socialImageUrl = getAbsoluteUrl(getCatalogProductHeroImage(product));
  const title = `${product.name} - tuile modulaire premium`;

  return {
    title,
    description: product.seoDescription,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    keywords: [
      product.name,
      "tuile de garage modulaire",
      "dalle de garage premium",
      "revetement garage",
      ...product.idealFor,
    ],
    openGraph: {
      title: `AceFloor | ${title}`,
      description: product.seoDescription,
      url: canonicalUrl ?? undefined,
      images: socialImageUrl
        ? [
            {
              url: socialImageUrl,
              alt: `${product.name} AceFloor`,
            },
          ]
        : undefined,
    },
    twitter: {
      title: `AceFloor | ${title}`,
      description: product.seoDescription,
      images: socialImageUrl ? [socialImageUrl] : undefined,
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getCatalogProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const narrative = getProductNarrative(product);
  const compareProducts = catalogProducts.filter(
    (catalogProduct) => catalogProduct.id !== product.id,
  );
  const canonicalUrl = getAbsoluteUrl(getCatalogProductHref(product));
  const heroImagePath = getCatalogProductHeroImage(product);
  const heroImageUrl = getAbsoluteUrl(heroImagePath);
  const faqs = buildProductFaqs(product);
  const structuredData = buildProductStructuredData(
    product,
    canonicalUrl,
    heroImageUrl,
    faqs,
  );

  return (
    <>
      {structuredData.map((schema, index) => (
        <script
          key={`product-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main>
        <section className="page-shell page-intro page-intro--product">
          <nav className="product-breadcrumbs" aria-label="Fil d'ariane">
            <Link href="/">Accueil</Link>
            <span>/</span>
            <Link href="/produits">Produits</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>

          <div className="product-hero-grid">
            <div className="product-hero-copy">
              <div className="eyebrow">Gamme AceFloor</div>
              <h1 className="page-intro-title">{product.name}</h1>
              <p className="page-intro-copy">{product.seoDescription}</p>
              <p className="page-intro-support">{narrative.heroLead}</p>

              <div className="tag-row page-intro-tags">
                <span className="tag">
                  {formatDimension(product.tileWidthIn)} x{" "}
                  {formatDimension(product.tileHeightIn)}
                </span>
                <span className="tag">
                  {formatDimension(product.tileThicknessIn)} ep.
                </span>
                <span className="tag">{product.tileWeightGrams} g</span>
                <span className="tag">{product.tilesPerBox} tuiles / boite</span>
                <span className="tag">{formatCurrency(product.pricePerSqFt)} / pi²</span>
                <span className="tag">{product.availableColors.length} couleurs</span>
              </div>

              <div className="product-action-row">
                <a href="#configurateur" className="button primary">
                  Configurer {product.name}
                </a>
                <Link href="/produits" className="button">
                  Voir les autres gammes
                </Link>
              </div>

              <div className="product-hero-highlights">
                <article className="seo-card">
                  <span className="seo-card-kicker">Positionnement</span>
                  <h3>{narrative.positioningTitle}</h3>
                  <p>{narrative.positioningCopy}</p>
                </article>
                <article className="seo-card">
                  <span className="seo-card-kicker">Meilleurs contextes</span>
                  <ul className="bullet-list">
                    {product.idealFor.map((useCase) => (
                      <li key={useCase}>{useCase}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>

            <div className="product-media-card">
              <div className="hero-visual product-media-visual">
                <img
                  src={heroImagePath}
                  alt={`${product.name} AceFloor en vue produit`}
                  className="hero-visual-image"
                />
              </div>
              <div className="product-media-caption">
                <span className="seo-card-kicker">
                  {product.mediaLabel ?? "Visuel produit"}
                </span>
                <p>{product.heroSummary}</p>
                {product.mediaNote ? <p>{product.mediaNote}</p> : null}
              </div>
            </div>
          </div>
        </section>

        <section id="configurateur">
          <ConfiguratorShell initialProductId={product.id} />
        </section>

        <section className="page-shell seo-stack">
          <section className="seo-section">
            <div className="section-intro">
              <h2 className="section-heading">Fiche rapide {product.name}</h2>
              <p className="section-copy">
                La page produit doit faire comprendre rapidement le positionnement,
                le format et le type de projet pour lequel cette gamme est la bonne.
              </p>
            </div>

            <div className="product-detail-grid">
              <article className="seo-card">
                <span className="seo-card-kicker">Lecture produit</span>
                <h3>{narrative.surfaceTitle}</h3>
                <p>{narrative.surfaceCopy}</p>
              </article>

              <article className="seo-card">
                <span className="seo-card-kicker">Format</span>
                <h3>Dimensions et masse</h3>
                <p>
                  Format {formatDimension(product.tileWidthIn)} x{" "}
                  {formatDimension(product.tileHeightIn)} po, epaisseur de{" "}
                  {formatDimension(product.tileThicknessIn)} po et poids unitaire de{" "}
                  {product.tileWeightGrams} g.
                </p>
              </article>

              <article className="seo-card">
                <span className="seo-card-kicker">Installation</span>
                <h3>Projection et estimatif</h3>
                <p>
                  Le configurateur facture a la tuile pleine: les tuiles coupees sont
                  comptees pleines, sans marge de pertes ajoutee artificiellement.
                </p>
              </article>
            </div>
          </section>

          <section className="seo-section">
            <div className="section-intro">
              <h2 className="section-heading">Palette disponible</h2>
              <p className="section-copy">
                La palette doit rester simple a lire: on voit la gamme, on voit les
                couleurs disponibles, puis on passe directement au plan.
              </p>
            </div>

            <div className="product-palette-grid">
              {product.availableColors.map((color) => (
                <div key={color} className="product-palette-chip">
                  <span
                    className="product-palette-dot"
                    style={{ backgroundColor: getCatalogColorHex(color) }}
                    aria-hidden="true"
                  />
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="seo-section">
            <div className="seo-grid seo-grid--two">
              <article className="seo-card">
                <h2 className="section-heading">Pourquoi choisir {product.name}</h2>
                <p>{narrative.salesAngle}</p>
                <ul className="bullet-list">
                  {product.featureBullets.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>

              <article className="seo-card">
                <h2 className="section-heading">Applications recommandees</h2>
                <p>{narrative.applicationLead}</p>
                <ul className="bullet-list">
                  {product.idealFor.map((useCase) => (
                    <li key={useCase}>{useCase}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="seo-section">
            <div className="section-intro">
              <h2 className="section-heading">Comparer les autres gammes AceFloor</h2>
              <p className="section-copy">
                La page produit doit aussi servir d'aiguillage propre quand le client
                hesite encore entre plusieurs textures ou plusieurs niveaux de rendu.
              </p>
            </div>

            <div className="seo-grid seo-grid--cards">
              {compareProducts.map((catalogProduct) => (
                <Link
                  key={catalogProduct.id}
                  href={getCatalogProductHref(catalogProduct)}
                  className="seo-card seo-card--link"
                >
                  <span className="seo-card-kicker">Autre gamme</span>
                  <h3>{catalogProduct.name}</h3>
                  <p>{catalogProduct.seoDescription}</p>
                  <div className="tag-row">
                    <span className="tag">{catalogProduct.tilesPerBox} tuiles / boite</span>
                    <span className="tag">
                      {formatCurrency(catalogProduct.pricePerSqFt)} / pi²
                    </span>
                    <span className="tag">{catalogProduct.tileWeightGrams} g</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="seo-section">
            <div className="section-intro">
              <h2 className="section-heading">FAQ {product.name}</h2>
              <p className="section-copy">
                Une FAQ courte permet de couvrir les questions de choix de gamme,
                d'usage reel et de configuration avant la soumission.
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

function buildProductStructuredData(
  product: CatalogProduct,
  canonicalUrl: string | null,
  heroImageUrl: string | null,
  faqs: { question: string; answer: string }[],
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "AceFloor",
          item: getAbsoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Produits",
          item: getAbsoluteUrl("/produits"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: product.name,
          item: canonicalUrl ?? undefined,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.seoDescription,
      brand: {
        "@type": "Brand",
        name: "AceFloor",
      },
      category: "Tuiles de garage modulaires",
      image: heroImageUrl ?? undefined,
      url: canonicalUrl ?? undefined,
      material: "Polypropylene",
      offers: {
        "@type": "Offer",
        price: product.pricePerSqFt.toFixed(2),
        priceCurrency: "CAD",
        availability: "https://schema.org/InStock",
        url: canonicalUrl ?? undefined,
      },
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
}

function getProductNarrative(product: CatalogProduct) {
  switch (product.id) {
    case "crown-series":
      return {
        heroLead:
          "La Crown Series porte le langage visuel principal de la marque: une grille ouverte nette, une lecture premium et une palette large pour monter des plans plus forts.",
        positioningTitle: "La gamme signature",
        positioningCopy:
          "C'est la base la plus directe si tu veux vendre AceFloor avec un rendu haut de gamme, lisible tout de suite sur un plan de garage ou de showroom.",
        surfaceTitle: "Texture ouverte iconique",
        surfaceCopy:
          "Le motif central et la trame ouverte donnent une lecture plus premium et plus reconnaissable qu'une dalle standard.",
        salesAngle:
          "Crown Series doit servir de reference quand le projet cherche l'equilibre entre impact visuel, personnalisation et rapidite de projection commerciale.",
        applicationLead:
          "Elle fonctionne bien dans les projets qui demandent un vrai rendu de marque, pas seulement une solution de plancher modulaire fonctionnelle.",
      };
    case "crown-cubic":
      return {
        heroLead:
          "La Crown Cubic pousse l'identite visuelle plus loin avec une lecture geometrique plus marquee et un rendu qui sort du langage classique du damier.",
        positioningTitle: "La version graphique",
        positioningCopy:
          "Cette gamme sert les projets ou le plancher doit jouer un role de signature visuelle et non seulement de finition technique.",
        surfaceTitle: "Texture geometrique forte",
        surfaceCopy:
          "Le relief cubic donne une presence plus design et plus distinctive dans les garages personnalises et les espaces commerciaux.",
        salesAngle:
          "Crown Cubic est pertinente quand la difference visuelle doit etre evidente des la premiere lecture du plan, meme avant de parler du reste du projet.",
        applicationLead:
          "Elle se prete surtout aux designs sur mesure, aux zones accent et aux espaces qui veulent un langage plus audacieux.",
      };
    case "crown-grip":
      return {
        heroLead:
          "La Crown Grip prend une direction plus technique, plus massive et plus musclee, avec une surface pleine qui change la perception globale du projet.",
        positioningTitle: "La version technique",
        positioningCopy:
          "Elle sert mieux les contextes qui veulent une impression plus robuste et une texture plus orientee performance.",
        surfaceTitle: "Surface pleine grip",
        surfaceCopy:
          "Le checker plate donne un rendu utilitaire premium qui colle bien aux garages de collection et aux zones techniques plus affirmees.",
        salesAngle:
          "Crown Grip est le bon angle quand le client veut quelque chose de plus dense, plus technique et moins ouvert visuellement.",
        applicationLead:
          "Elle se defend bien dans les garages performance, les espaces mecanique propres et les projets a direction plus industrielle.",
      };
    default:
      return {
        heroLead:
          "Acetrax garde le meme format modulaire AceFloor dans une lecture plus legere, utile pour les projets qui veulent controler le budget sans perdre l'effet visuel general.",
        positioningTitle: "L'option plus legere",
        positioningCopy:
          "C'est le bon point d'entree quand le projet cherche une solution efficace, plus accessible et rapide a configurer.",
        surfaceTitle: "Format AceFloor plus accessible",
        surfaceCopy:
          "Acetrax reprend le format et la logique de composition AceFloor avec un poids reduit a 500 g par tuile.",
        salesAngle:
          "Acetrax doit servir les projets ou la vitesse de decision, le budget et l'impact visuel general comptent plus qu'un rendu ultra signature.",
        applicationLead:
          "Elle convient bien aux garages polyvalents, aux projets rapides et aux configurations qui doivent rester efficaces commercialement.",
      };
  }
}

function buildProductFaqs(product: CatalogProduct) {
  return [
    {
      question: `${product.name} convient-il surtout a un garage ou a un showroom ?`,
      answer:
        `${product.name} peut servir les deux. Le choix depend surtout du niveau de rendu voulu, du langage visuel cherche et de la maniere dont le projet doit etre presente au client final.`,
    },
    {
      question: `Peut-on configurer ${product.name} avec plusieurs couleurs ?`,
      answer:
        `Oui. Le configurateur AceFloor permet de tester les couleurs disponibles de la gamme, de partir d'un preset puis d'editer tuile par tuile directement sur le plan.`,
    },
    {
      question: `Pourquoi faire une page dediee a ${product.name} ?`,
      answer:
        `La page dediee clarifie le positionnement de la gamme, ouvre un point d'entree SEO plus propre et aide le visiteur a comparer plus vite les differentes options AceFloor.`,
    },
  ];
}
