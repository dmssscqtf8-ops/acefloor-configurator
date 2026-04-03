import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency, formatDimension } from "@acefloor/core-engine";
import {
  catalogProducts,
  getCatalogProductHeroImage,
  getCatalogProductHref,
} from "../../features/configurator/data/mock-catalog";
import { getAbsoluteUrl } from "../../lib/site";

const canonicalUrl = getAbsoluteUrl("/produits");
const socialImageUrl = getAbsoluteUrl(
  getCatalogProductHeroImage(catalogProducts[0]),
);

export const metadata: Metadata = {
  title: "Produits - gammes AceFloor",
  description:
    "Comparez les gammes AceFloor Crown Series, Crown Cubic, Crown Grip et Acetrax pour choisir la bonne tuile modulaire selon votre garage, showroom ou atelier.",
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  openGraph: {
    title: "AceFloor | Produits",
    description:
      "Toutes les gammes AceFloor sur une seule page pour comparer format, poids, rendu et usages recommandes.",
    url: canonicalUrl ?? undefined,
    images: socialImageUrl
      ? [
          {
            url: socialImageUrl,
            alt: "Gammes de tuiles AceFloor",
          },
        ]
      : undefined,
  },
  twitter: {
    title: "AceFloor | Produits",
    description:
      "Comparez les gammes AceFloor pour garage, showroom et atelier.",
    images: socialImageUrl ? [socialImageUrl] : undefined,
  },
};

export default function ProductsPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Produits AceFloor",
      description:
        "Catalogue des gammes AceFloor pour comparer les tuiles modulaires premium.",
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
        url: getAbsoluteUrl(getCatalogProductHref(product)) ?? undefined,
      })),
    },
  ];

  return (
    <>
      {structuredData.map((schema, index) => (
        <script
          key={`products-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main>
        <section className="page-shell page-intro">
          <div className="eyebrow">Catalogue AceFloor</div>
          <h1 className="page-intro-title">Nos gammes de tuiles modulaires</h1>
          <p className="page-intro-copy">
            Cette page doit permettre de comparer rapidement les grandes familles
            AceFloor, puis d'ouvrir la bonne page produit ou le configurateur sans
            perdre le visiteur dans un catalogue plat.
          </p>
          <div className="tag-row page-intro-tags">
            <span className="tag">Crown Series</span>
            <span className="tag">Crown Cubic</span>
            <span className="tag">Crown Grip</span>
            <span className="tag">Acetrax</span>
          </div>
        </section>

        <section className="page-shell seo-stack">
          <section className="seo-section">
            <div className="section-intro">
              <h2 className="section-heading">Choisir la bonne gamme</h2>
              <p className="section-copy">
                Le bon produit ne se choisit pas seulement sur la couleur. Il se
                choisit sur le niveau de rendu attendu, le contexte d'installation
                et la perception que le projet doit donner.
              </p>
            </div>

            <div className="product-catalog-grid">
              {catalogProducts.map((product, index) => (
                <article key={product.id} className="product-catalog-card">
                  <div className="product-catalog-media">
                    <img
                      src={getCatalogProductHeroImage(product)}
                      alt={`${product.name} AceFloor`}
                    />
                  </div>

                  <div className="product-catalog-body">
                    <span className="seo-card-kicker">Gamme {index + 1}</span>
                    <h2>{product.name}</h2>
                    <p>{product.seoDescription}</p>

                    <div className="tag-row">
                      <span className="tag">
                        {formatDimension(product.tileWidthIn)} x{" "}
                        {formatDimension(product.tileHeightIn)}
                      </span>
                      <span className="tag">{product.tileWeightGrams} g</span>
                      <span className="tag">
                        {formatCurrency(product.pricePerTile)} / tuile
                      </span>
                    </div>

                    <ul className="bullet-list">
                      {product.featureBullets.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <div className="product-catalog-actions">
                      <Link
                        href={getCatalogProductHref(product)}
                        className="button primary"
                      >
                        Voir la page produit
                      </Link>
                      <Link
                        href={`${getCatalogProductHref(product)}#configurateur`}
                        className="button"
                      >
                        Ouvrir le configurateur
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="seo-section">
            <div className="section-intro">
              <h2 className="section-heading">Lecture rapide des gammes</h2>
              <p className="section-copy">
                Cette vue courte sert aux visiteurs qui veulent comprendre la logique
                de la collection avant d'entrer dans le detail d'une page produit.
              </p>
            </div>

            <div className="seo-grid seo-grid--cards">
              {catalogProducts.map((product) => (
                <Link
                  key={`${product.id}-summary`}
                  href={getCatalogProductHref(product)}
                  className="seo-card seo-card--link"
                >
                  <span className="seo-card-kicker">Resume</span>
                  <h3>{product.name}</h3>
                  <p>{product.heroSummary}</p>
                  <div className="tag-row">
                    <span className="tag">{product.availableColors.length} couleurs</span>
                    <span className="tag">{product.idealFor[0]}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
