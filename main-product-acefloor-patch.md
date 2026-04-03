# Patch Dawn `sections/main-product.liquid`

Utilise ces 4 insertions dans ton fichier `sections/main-product.liquid`.

## 1. Ajoute les assignations AceFloor

Colle ce bloc juste avant :

```liquid
{% assign variant_images = product.images | where: 'attached_to_variant?', true | map: 'src' %}
```

```liquid
{%- liquid
  assign acefloor_intro = product.metafields.custom.short_intro.value
  if acefloor_intro == blank
    assign acefloor_intro = product.description | strip_html | truncatewords: 30
  endif

  assign acefloor_tile_size = product.metafields.custom.tile_size.value
  if acefloor_tile_size == blank
    assign acefloor_tile_size = section.settings.tile_size_fallback
  endif

  assign acefloor_tile_thickness = product.metafields.custom.tile_thickness.value
  if acefloor_tile_thickness == blank
    assign acefloor_tile_thickness = section.settings.tile_thickness_fallback
  endif

  assign acefloor_tile_weight = product.metafields.custom.tile_weight.value
  if acefloor_tile_weight == blank
    assign acefloor_tile_weight = section.settings.tile_weight_fallback
  endif

  assign acefloor_primary_use = product.metafields.custom.primary_use.value
  assign acefloor_configurator_url = product.metafields.custom.configurator_url.value | default: section.settings.configurator_link
  assign acefloor_variant_count = product.variants.size
-%}
```

## 2. Ajoute le header produit AceFloor

Colle ce bloc juste après :

```liquid
{%- assign product_form_id = 'product-form-' | append: section.id -%}
```

```liquid
<div class="acefloor-product-header">
  {% if section.settings.eyebrow_text != blank %}
    <div class="acefloor-product-header__eyebrow">{{ section.settings.eyebrow_text }}</div>
  {% endif %}

  {% if acefloor_intro != blank %}
    <p class="acefloor-product-header__intro">{{ acefloor_intro }}</p>
  {% endif %}

  <div class="acefloor-product-stats">
    {% if acefloor_tile_size != blank %}
      <div class="acefloor-product-stat">
        <span class="acefloor-product-stat__label">Format</span>
        <strong>{{ acefloor_tile_size }}</strong>
      </div>
    {% endif %}

    {% if acefloor_tile_thickness != blank %}
      <div class="acefloor-product-stat">
        <span class="acefloor-product-stat__label">Epaisseur</span>
        <strong>{{ acefloor_tile_thickness }}</strong>
      </div>
    {% endif %}

    {% if acefloor_tile_weight != blank %}
      <div class="acefloor-product-stat">
        <span class="acefloor-product-stat__label">Poids</span>
        <strong>{{ acefloor_tile_weight }}</strong>
      </div>
    {% endif %}

    <div class="acefloor-product-stat">
      <span class="acefloor-product-stat__label">Couleurs</span>
      <strong>{{ acefloor_variant_count }}</strong>
    </div>
  </div>

  <div class="acefloor-product-pills">
    {% if acefloor_primary_use != blank %}
      <span class="acefloor-product-pill">{{ acefloor_primary_use }}</span>
    {% endif %}
    {% if section.settings.highlight_1 != blank %}
      <span class="acefloor-product-pill">{{ section.settings.highlight_1 }}</span>
    {% endif %}
    {% if section.settings.highlight_2 != blank %}
      <span class="acefloor-product-pill">{{ section.settings.highlight_2 }}</span>
    {% endif %}
    {% if section.settings.highlight_3 != blank %}
      <span class="acefloor-product-pill">{{ section.settings.highlight_3 }}</span>
    {% endif %}
  </div>

  {% if acefloor_configurator_url != blank %}
    <a href="{{ acefloor_configurator_url }}" class="acefloor-product-header__cta">
      {{ section.settings.configurator_label | default: 'Configurer cette gamme' }}
    </a>
  {% endif %}
</div>
```

## 3. Ajoute le CSS premium AceFloor

Colle ce bloc dans le `{%- style -%}` existant, juste avant `{%- endstyle -%}`.

```liquid
#MainProduct-{{ section.id }} .product {
  gap: 3rem;
}

#MainProduct-{{ section.id }} .product__media-wrapper {
  border-radius: 2.8rem;
  overflow: hidden;
}

#MainProduct-{{ section.id }} .product__info-container > * + * {
  margin-top: 1.4rem;
}

#MainProduct-{{ section.id }} .acefloor-product-header {
  padding: 2rem;
  border-radius: 2rem;
  border: 1px solid rgba(214, 169, 64, 0.2);
  background:
    radial-gradient(circle at top right, rgba(214, 169, 64, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(14, 16, 21, 0.96) 0%, rgba(8, 10, 14, 0.98) 100%);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
}

#MainProduct-{{ section.id }} .acefloor-product-header__eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 2.6rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(214, 169, 64, 0.3);
  background: rgba(214, 169, 64, 0.08);
  color: #d6a940;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

#MainProduct-{{ section.id }} .acefloor-product-header__intro {
  margin: 1.4rem 0 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

#MainProduct-{{ section.id }} .acefloor-product-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.6rem;
}

#MainProduct-{{ section.id }} .acefloor-product-stat {
  padding: 1.2rem 1.3rem;
  border-radius: 1.6rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

#MainProduct-{{ section.id }} .acefloor-product-stat__label {
  display: block;
  margin-bottom: 0.55rem;
  color: rgba(255, 255, 255, 0.56);
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

#MainProduct-{{ section.id }} .acefloor-product-stat strong {
  color: #ffffff;
  font-size: 1.7rem;
  line-height: 1.1;
}

#MainProduct-{{ section.id }} .acefloor-product-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.4rem;
}

#MainProduct-{{ section.id }} .acefloor-product-pill {
  display: inline-flex;
  align-items: center;
  min-height: 2.8rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.84);
  font-size: 1.25rem;
}

#MainProduct-{{ section.id }} .acefloor-product-header__cta {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 5rem;
  margin-top: 1.6rem;
  padding: 0 1.6rem;
  border-radius: 1.4rem;
  background: linear-gradient(135deg, #f1c75b 0%, #c99724 100%);
  color: #111111;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.18s ease, filter 0.18s ease;
}

#MainProduct-{{ section.id }} .acefloor-product-header__cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

#MainProduct-{{ section.id }} .product__title h1,
#MainProduct-{{ section.id }} .product__title .h1 {
  margin: 0;
  font-size: clamp(3.4rem, 4vw, 5.8rem);
  line-height: 0.94;
  letter-spacing: -0.04em;
}

#MainProduct-{{ section.id }} .product__description,
#MainProduct-{{ section.id }} .product__accordion,
#MainProduct-{{ section.id }} .product-form__input,
#MainProduct-{{ section.id }} .product__text,
#MainProduct-{{ section.id }} #price-{{ section.id }},
#MainProduct-{{ section.id }} .product__inventory,
#MainProduct-{{ section.id }} .product__sku,
#MainProduct-{{ section.id }} .product-popup-modal__opener,
#MainProduct-{{ section.id }} .rating-wrapper,
#MainProduct-{{ section.id }} .share-button__button,
#MainProduct-{{ section.id }} .product__tax {
  padding: 1.6rem;
  border-radius: 1.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(9, 11, 15, 0.78);
}

#MainProduct-{{ section.id }} .product-form__buttons .button,
#MainProduct-{{ section.id }} .shopify-payment-button__button {
  min-height: 5.2rem;
  border-radius: 1.4rem;
}

#MainProduct-{{ section.id }} .accordion summary {
  padding: 0;
}

@media screen and (max-width: 989px) {
  #MainProduct-{{ section.id }} .acefloor-product-stats {
    grid-template-columns: 1fr;
  }
}
```

## 4. Ajoute les settings de section

Dans le tableau `"settings": [`, colle ce bloc juste apres `color_scheme` :

```json
{
  "type": "text",
  "id": "eyebrow_text",
  "label": "Eyebrow AceFloor",
  "default": "AceFloor Premium"
},
{
  "type": "text",
  "id": "tile_size_fallback",
  "label": "Format tuile fallback",
  "default": "15,75 x 15,75 po"
},
{
  "type": "text",
  "id": "tile_thickness_fallback",
  "label": "Epaisseur fallback",
  "default": "0,75 po"
},
{
  "type": "text",
  "id": "tile_weight_fallback",
  "label": "Poids fallback",
  "default": "600 g"
},
{
  "type": "text",
  "id": "highlight_1",
  "label": "Point fort 1",
  "default": "Garages premium"
},
{
  "type": "text",
  "id": "highlight_2",
  "label": "Point fort 2",
  "default": "Showrooms automobiles"
},
{
  "type": "text",
  "id": "highlight_3",
  "label": "Point fort 3",
  "default": "Installation rapide"
},
{
  "type": "text",
  "id": "configurator_label",
  "label": "Texte bouton configurateur",
  "default": "Configurer cette gamme"
},
{
  "type": "url",
  "id": "configurator_link",
  "label": "Lien configurateur"
}
```

## Metafields optionnels

Si tu veux que chaque produit ait son propre contenu sans dupliquer des templates, ajoute ces metafields produit dans Shopify :

- `custom.short_intro`
- `custom.tile_size`
- `custom.tile_thickness`
- `custom.tile_weight`
- `custom.primary_use`
- `custom.configurator_url`

Le patch fonctionne meme sans eux, avec les fallbacks de section.
