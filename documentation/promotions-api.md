# API de Gestion des Promotions

Ce document décrit les endpoints de l'API pour la gestion des promotions et des événements promotionnels.

## Format de Réponse Standard

Toutes les réponses de l'API suivent désormais un format standard :

```json
{
  "status": "success",
  "data": { ... }
}
```

ou en cas d'erreur :

```json
{
  "status": "error",
  "message": "Description de l'erreur",
  "errors": { ... }
}
```

## Promotions

### Récupérer la liste des promotions

```
GET /api/promotions
```

**Paramètres de requête :**
- `statut` : Filtrer par statut (`active`, `inactive`, `programmée`)
- `type` : Filtrer par type (`pourcentage`, `montant_fixe`, `gratuit`)
- `event_id` : Filtrer par événement promotionnel
- `category_id` : Filtrer par catégorie
- `brand_id` : Filtrer par marque
- `featured` : Filtrer les promotions mises en avant (`true` ou `false`)
- `actives_seulement` : Filtrer uniquement les promotions actives (`true` ou `false`)
- `search` : Rechercher par nom, code ou description
- `sort` : Champ de tri (`id`, `nom`, `valeur`, `date_debut`, `date_fin`, `priorité`, `created_at`)
- `direction` : Direction du tri (`asc` ou `desc`)
- `with` : Relations à inclure (séparées par des virgules : `produits`, `collections`, `profilsRemise`, `event`)
- `per_page` : Nombre d'éléments par page (défaut : 15)
- `page` : Numéro de page

**Exemple de réponse :**
```json
{
  "status": "success",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "event_id": 1,
        "nom": "Soldes d'été",
        "code": "SUMMER2025",
        "description": "Profitez de 20% de réduction sur tous les produits",
        "type": "pourcentage",
        "valeur": 20,
        "statut": "active",
        "date_debut": "2025-06-01T00:00:00.000000Z",
        "date_fin": "2025-08-31T23:59:59.000000Z",
        "priorité": 10,
        "cumulable": false,
        "conditions": null,
        "image": "https://example.com/images/summer-sale.jpg",
        "featured": true,
        "created_at": "2025-04-23T21:00:00.000000Z",
        "updated_at": "2025-04-23T21:00:00.000000Z",
        "event": {
          "id": 1,
          "nom": "Soldes d'été",
          "code": "SUMMER_SALE",
          "description": "Promotions estivales",
          "couleur": "#FF9900",
          "icone": "sun",
          "actif": true,
          "date_debut": "2025-06-01",
          "date_fin": "2025-08-31",
          "created_at": "2025-04-23T21:00:00.000000Z",
          "updated_at": "2025-04-23T21:00:00.000000Z",
          "deleted_at": null
        }
      }
    ],
    "first_page_url": "http://example.com/api/promotions?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://example.com/api/promotions?page=1",
    "links": [...],
    "next_page_url": null,
    "path": "http://example.com/api/promotions",
    "per_page": 15,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

### Créer une promotion

```
POST /api/promotions
```

**Corps de la requête :**
```json
{
  "nom": "Soldes d'été",
  "code": "SUMMER2025",
  "description": "Profitez de 20% de réduction sur tous les produits",
  "type": "pourcentage",
  "valeur": 20,
  "statut": "active",
  "date_debut": "2025-06-01",
  "date_fin": "2025-08-31",
  "priorité": 10,
  "cumulable": false,
  "conditions": null,
  "event_id": 1,
  "image": "https://example.com/images/summer-sale.jpg",
  "featured": true,
  "produits": [1, 2, 3],
  "collections": [1],
  "profils_remise": ["standard", "premium"]
}
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Promotion créée avec succès",
  "data": {
    "id": 1,
    "event_id": 1,
    "nom": "Soldes d'été",
    "code": "SUMMER2025",
    "description": "Profitez de 20% de réduction sur tous les produits",
    "type": "pourcentage",
    "valeur": 20,
    "statut": "active",
    "date_debut": "2025-06-01T00:00:00.000000Z",
    "date_fin": "2025-08-31T23:59:59.000000Z",
    "priorité": 10,
    "cumulable": false,
    "conditions": null,
    "image": "https://example.com/images/summer-sale.jpg",
    "featured": true,
    "created_at": "2025-04-23T21:00:00.000000Z",
    "updated_at": "2025-04-23T21:00:00.000000Z"
  }
}
```

### Récupérer une promotion spécifique

```
GET /api/promotions/{id}
```

**Paramètres de requête :**
- `with` : Relations à inclure (séparées par des virgules : `produits`, `collections`, `profilsRemise`, `event`)

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "event_id": 1,
    "nom": "Soldes d'été",
    "code": "SUMMER2025",
    "description": "Profitez de 20% de réduction sur tous les produits",
    "type": "pourcentage",
    "valeur": 20,
    "statut": "active",
    "date_debut": "2025-06-01T00:00:00.000000Z",
    "date_fin": "2025-08-31T23:59:59.000000Z",
    "priorité": 10,
    "cumulable": false,
    "conditions": null,
    "image": "https://example.com/images/summer-sale.jpg",
    "featured": true,
    "created_at": "2025-04-23T21:00:00.000000Z",
    "updated_at": "2025-04-23T21:00:00.000000Z",
    "produits": [...],
    "collections": [...],
    "profilsRemise": [...],
    "event": {...}
  }
}
```

### Mettre à jour une promotion

```
PUT /api/promotions/{id}
```

**Corps de la requête :**
```json
{
  "nom": "Soldes d'été 2025",
  "valeur": 25,
  "featured": true,
  "produits": [1, 2, 3, 4],
  "collections": [1, 2],
  "profils_remise": ["standard", "premium", "affiliated"]
}
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Promotion mise à jour avec succès",
  "data": {
    "id": 1,
    "event_id": 1,
    "nom": "Soldes d'été 2025",
    "code": "SUMMER2025",
    "description": "Profitez de 20% de réduction sur tous les produits",
    "type": "pourcentage",
    "valeur": 25,
    "statut": "active",
    "date_debut": "2025-06-01T00:00:00.000000Z",
    "date_fin": "2025-08-31T23:59:59.000000Z",
    "priorité": 10,
    "cumulable": false,
    "conditions": null,
    "image": "https://example.com/images/summer-sale.jpg",
    "featured": true,
    "created_at": "2025-04-23T21:00:00.000000Z",
    "updated_at": "2025-04-23T21:30:00.000000Z"
  }
}
```

### Supprimer une promotion

```
DELETE /api/promotions/{id}
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Promotion supprimée avec succès"
}
```

### Récupérer les produits associés à une promotion

```
GET /api/promotions/{id}/products
```

**Paramètres de requête :**
- `category_id` : Filtrer par catégorie
- `sous_categorie_id` : Filtrer par sous-catégorie
- `sous_sous_categorie_id` : Filtrer par sous-sous-catégorie
- `marque_id` : Filtrer par marque
- `search` : Rechercher par nom, description ou référence
- `sort` : Champ de tri (`id`, `nom_produit`, `prix_produit`, `quantite_produit`, `created_at`)
- `direction` : Direction du tri (`asc` ou `desc`)
- `per_page` : Nombre d'éléments par page (défaut : 15)
- `page` : Numéro de page

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "promotion": {
      "id": 1,
      "nom": "Soldes d'été 2025",
      "code": "SUMMER2025",
      "type": "pourcentage",
      "valeur": 25,
      "statut": "active"
    },
    "produits": {
      "current_page": 1,
      "data": [
        {
          "id": 1,
          "nom_produit": "Canapé moderne",
          "description_produit": "Canapé confortable et élégant",
          "prix_produit": 599.99,
          "image_produit": "https://example.com/images/canape.jpg",
          "quantite_produit": 10,
          "marque_id": 1,
          "sous_sous_categorie_id": 5,
          "reference": "1-1",
          "created_at": "2025-04-01T10:00:00.000000Z",
          "updated_at": "2025-04-01T10:00:00.000000Z",
          "pivot": {
            "promotion_id": 1,
            "produit_id": 1,
            "date_debut": null,
            "date_fin": null,
            "created_at": "2025-04-23T21:00:00.000000Z",
            "updated_at": "2025-04-23T21:00:00.000000Z"
          }
        }
      ],
      "first_page_url": "http://example.com/api/promotions/1/products?page=1",
      "from": 1,
      "last_page": 1,
      "last_page_url": "http://example.com/api/promotions/1/products?page=1",
      "links": [...],
      "next_page_url": null,
      "path": "http://example.com/api/promotions/1/products",
      "per_page": 15,
      "prev_page_url": null,
      "to": 1,
      "total": 1
    }
  }
}
```

### Récupérer les promotions mises en avant

```
GET /api/promotions/featured
```

**Paramètres de requête :**
- `with` : Relations à inclure (séparées par des virgules : `produits`, `collections`, `profilsRemise`, `event`)
- `limit` : Nombre maximum de promotions à retourner (défaut : 5, max : 20)

**Réponse :**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "event_id": 1,
      "nom": "Soldes d'été 2025",
      "code": "SUMMER2025",
      "description": "Profitez de 25% de réduction sur tous les produits",
      "type": "pourcentage",
      "valeur": 25,
      "statut": "active",
      "date_debut": "2025-06-01T00:00:00.000000Z",
      "date_fin": "2025-08-31T23:59:59.000000Z",
      "priorité": 10,
      "cumulable": false,
      "conditions": null,
      "image": "https://example.com/images/summer-sale.jpg",
      "featured": true,
      "created_at": "2025-04-23T21:00:00.000000Z",
      "updated_at": "2025-04-23T21:30:00.000000Z"
    }
  ]
}
```

### Récupérer les promotions similaires

```
GET /api/promotions/{id}/related
```

**Paramètres de requête :**
- `limit` : Nombre maximum de promotions à retourner (défaut : 4, max : 10)

**Réponse :**
```json
{
  "status": "success",
  "data": [
    {
      "id": 2,
      "event_id": 1,
      "nom": "Offre spéciale meubles",
      "code": "FURNITURE25",
      "description": "25% de réduction sur tous les meubles",
      "type": "pourcentage",
      "valeur": 25,
      "statut": "active",
      "date_debut": "2025-06-01T00:00:00.000000Z",
      "date_fin": "2025-08-31T23:59:59.000000Z",
      "priorité": 8,
      "cumulable": false,
      "conditions": null,
      "image": "https://example.com/images/furniture-sale.jpg",
      "featured": false,
      "created_at": "2025-04-23T21:00:00.000000Z",
      "updated_at": "2025-04-23T21:00:00.000000Z"
    }
  ]
}
```

## Événements Promotionnels

### Récupérer la liste des événements promotionnels

```
GET /api/promotion-events
```

**Paramètres de requête :**
- `actif` : Filtrer par statut actif (`true` ou `false`)
- `actifs_seulement` : Filtrer uniquement les événements actifs par date (`true` ou `false`)
- `search` : Rechercher par nom, code ou description
- `sort` : Champ de tri (`nom`, `code`, `date_debut`, `date_fin`, `created_at`)
- `direction` : Direction du tri (`asc` ou `desc`)
- `per_page` : Nombre d'éléments par page (défaut : 15)
- `page` : Numéro de page

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "nom": "Soldes d'été",
        "code": "SUMMER_SALE",
        "description": "Promotions estivales",
        "couleur": "#FF9900",
        "icone": "sun",
        "actif": true,
        "date_debut": "2025-06-01",
        "date_fin": "2025-08-31",
        "created_at": "2025-04-23T21:00:00.000000Z",
        "updated_at": "2025-04-23T21:00:00.000000Z",
        "deleted_at": null
      }
    ],
    "first_page_url": "http://example.com/api/promotion-events?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://example.com/api/promotion-events?page=1",
    "links": [...],
    "next_page_url": null,
    "path": "http://example.com/api/promotion-events",
    "per_page": 15,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

### Créer un événement promotionnel

```
POST /api/promotion-events
```

**Corps de la requête :**
```json
{
  "nom": "Black Friday",
  "code": "BLACK_FRIDAY",
  "description": "Promotions exceptionnelles pour le Black Friday",
  "couleur": "#000000",
  "icone": "tag",
  "actif": true,
  "date_debut": "2025-11-29",
  "date_fin": "2025-11-30"
}
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Événement promotionnel créé avec succès",
  "data": {
    "id": 2,
    "nom": "Black Friday",
    "code": "BLACK_FRIDAY",
    "description": "Promotions exceptionnelles pour le Black Friday",
    "couleur": "#000000",
    "icone": "tag",
    "actif": true,
    "date_debut": "2025-11-29",
    "date_fin": "2025-11-30",
    "created_at": "2025-04-23T22:00:00.000000Z",
    "updated_at": "2025-04-23T22:00:00.000000Z",
    "deleted_at": null
  }
}
```

### Récupérer un événement promotionnel spécifique

```
GET /api/promotion-events/{id}
```

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "id": 2,
    "nom": "Black Friday",
    "code": "BLACK_FRIDAY",
    "description": "Promotions exceptionnelles pour le Black Friday",
    "couleur": "#000000",
    "icone": "tag",
    "actif": true,
    "date_debut": "2025-11-29",
    "date_fin": "2025-11-30",
    "created_at": "2025-04-23T22:00:00.000000Z",
    "updated_at": "2025-04-23T22:00:00.000000Z",
    "deleted_at": null
  }
}
```

### Mettre à jour un événement promotionnel

```
PUT /api/promotion-events/{id}
```

**Corps de la requête :**
```json
{
  "nom": "Black Friday 2025",
  "description": "Les meilleures offres de l'année",
  "couleur": "#111111"
}
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Événement promotionnel mis à jour avec succès",
  "data": {
    "id": 2,
    "nom": "Black Friday 2025",
    "code": "BLACK_FRIDAY",
    "description": "Les meilleures offres de l'année",
    "couleur": "#111111",
    "icone": "tag",
    "actif": true,
    "date_debut": "2025-11-29",
    "date_fin": "2025-11-30",
    "created_at": "2025-04-23T22:00:00.000000Z",
    "updated_at": "2025-04-23T22:30:00.000000Z",
    "deleted_at": null
  }
}
```

### Supprimer un événement promotionnel

```
DELETE /api/promotion-events/{id}
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Événement promotionnel supprimé avec succès"
}
```

### Récupérer les promotions associées à un événement

```
GET /api/promotion-events/{id}/promotions
```

**Paramètres de requête :**
- `statut` : Filtrer par statut (`active`, `inactive`, `programmée`)
- `actives_seulement` : Filtrer uniquement les promotions actives par date (`true` ou `false`)
- `per_page` : Nombre d'éléments par page (défaut : 15)
- `page` : Numéro de page

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "event": {
      "id": 1,
      "nom": "Soldes d'été",
      "code": "SUMMER_SALE",
      "actif": true,
      "date_debut": "2025-06-01",
      "date_fin": "2025-08-31"
    },
    "promotions": {
      "current_page": 1,
      "data": [
        {
          "id": 1,
          "event_id": 1,
          "nom": "Soldes d'été 2025",
          "code": "SUMMER2025",
          "description": "Profitez de 25% de réduction sur tous les produits",
          "type": "pourcentage",
          "valeur": 25,
          "statut": "active",
          "date_debut": "2025-06-01T00:00:00.000000Z",
          "date_fin": "2025-08-31T23:59:59.000000Z",
          "priorité": 10,
          "cumulable": false,
          "conditions": null,
          "image": "https://example.com/images/summer-sale.jpg",
          "featured": true,
          "created_at": "2025-04-23T21:00:00.000000Z",
          "updated_at": "2025-04-23T21:30:00.000000Z"
        }
      ],
      "first_page_url": "http://example.com/api/promotion-events/1/promotions?page=1",
      "from": 1,
      "last_page": 1,
      "last_page_url": "http://example.com/api/promotion-events/1/promotions?page=1",
      "links": [...],
      "next_page_url": null,
      "path": "http://example.com/api/promotion-events/1/promotions",
      "per_page": 15,
      "prev_page_url": null,
      "to": 1,
      "total": 1
    }
  }
}
```

## Règles de Validation

### Promotion

| Champ | Règles |
|-------|--------|
| nom | Requis, chaîne, max 255 caractères |
| code | Optionnel, chaîne, max 50 caractères, unique |
| description | Optionnel, chaîne |
| type | Requis, une des valeurs : `pourcentage`, `montant_fixe`, `gratuit` |
| valeur | Requis, numérique, min 0 |
| statut | Requis, une des valeurs : `active`, `inactive`, `programmée` |
| date_debut | Optionnel, date |
| date_fin | Optionnel, date, après ou égale à date_debut |
| priorité | Optionnel, entier |
| cumulable | Optionnel, booléen |
| conditions | Optionnel, tableau |
| event_id | Optionnel, existe dans la table promotion_events |
| image | Optionnel, chaîne (URL) |
| featured | Optionnel, booléen |

### Événement Promotionnel

| Champ | Règles |
|-------|--------|
| nom | Requis, chaîne, max 255 caractères |
| code | Requis, chaîne, max 50 caractères, unique |
| description | Optionnel, chaîne |
| couleur | Optionnel, chaîne, max 20 caractères |
| icone | Optionnel, chaîne, max 255 caractères |
| actif | Optionnel, booléen |
| date_debut | Optionnel, date |
| date_fin | Optionnel, date, après ou égale à date_debut |
