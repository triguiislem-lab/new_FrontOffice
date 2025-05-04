# API de Gestion du Panier et de la Liste de Souhaits

Ce document décrit les endpoints de l'API pour la gestion du panier d'achat et de la liste de souhaits.

## Format de Réponse Standard

Toutes les réponses de l'API suivent un format standard :

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

## Panier d'Achat (Cart)

Le panier d'achat permet aux utilisateurs de stocker temporairement les produits qu'ils souhaitent acheter. Le système prend en charge à la fois les utilisateurs authentifiés et les sessions invités.

### Récupérer le contenu du panier

```
GET /api/cart
```

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "session_id": "abc123xyz",
    "client_id": 5,
    "items": [
      {
        "id": 1,
        "produit": {
          "id": 42,
          "nom": "Canapé moderne",
          "description": "Canapé confortable et élégant",
          "reference": "1-42",
          "image": "https://example.com/images/canape.jpg",
          "prix": 599.99,
          "en_stock": true,
          "stock_disponible": 10
        },
        "variante": {
          "id": 3,
          "nom": "Canapé moderne - Gris",
          "sku": "1-42-3",
          "prix_supplement": 50,
          "attributs": [
            {
              "nom": "Couleur",
              "valeur": "Gris"
            },
            {
              "nom": "Matière",
              "valeur": "Tissu"
            }
          ]
        },
        "quantite": 1,
        "prix_unitaire": 649.99,
        "prix_total": 649.99
      }
    ],
    "nombre_items": 1,
    "sous_total": 649.99,
    "total": 649.99,
    "date_creation": "2025-04-24T10:00:00.000000Z",
    "date_modification": "2025-04-24T10:00:00.000000Z"
  }
}
```

### Ajouter un produit au panier

```
POST /api/cart/items
```

**Corps de la requête :**
```json
{
  "produit_id": 42,
  "variante_id": 3,
  "quantite": 1
}
```

**Réponse :**
Retourne le panier mis à jour avec le même format que `GET /api/cart`.

### Mettre à jour la quantité d'un produit

```
PUT /api/cart/items/{id}
```

**Corps de la requête :**
```json
{
  "quantite": 2
}
```

**Réponse :**
Retourne le panier mis à jour avec le même format que `GET /api/cart`.

### Supprimer un produit du panier

```
DELETE /api/cart/items/{id}
```

**Réponse :**
Retourne le panier mis à jour avec le même format que `GET /api/cart`.

### Vider le panier

```
DELETE /api/cart
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Panier vidé avec succès",
  "data": {
    "id": 1,
    "nombre_items": 0,
    "sous_total": 0,
    "total": 0,
    "items": []
  }
}
```

### Fusionner un panier invité avec un panier utilisateur

```
POST /api/cart/merge
```

**Corps de la requête :**
```json
{
  "guest_cart_id": 2
}
```

**Réponse :**
Retourne le panier fusionné avec le même format que `GET /api/cart`.

## Liste de Souhaits (Wishlist)

La liste de souhaits permet aux utilisateurs authentifiés de sauvegarder des produits pour les consulter ou les acheter ultérieurement.

### Récupérer la liste de souhaits

```
GET /api/wishlist
```

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "liste_souhait": {
      "id": 1,
      "nom": "Ma liste de souhaits",
      "description": null,
      "nombre_items": 1
    },
    "items": [
      {
        "id": 1,
        "produit": {
          "id": 42,
          "nom": "Canapé moderne",
          "description": "Canapé confortable et élégant",
          "image": "https://example.com/images/canape.jpg",
          "prix": 599.99,
          "reference": "1-42",
          "en_stock": true
        },
        "variante": {
          "id": 3,
          "nom": "Canapé moderne - Gris",
          "prix_supplement": 50
        },
        "note": "J'aime beaucoup ce modèle",
        "prix_reference": 649.99,
        "prix_actuel": 649.99,
        "prix_a_change": false,
        "difference_prix": 0,
        "date_ajout": "2025-04-24T10:00:00.000000Z"
      }
    ]
  }
}
```

### Ajouter un produit à la liste de souhaits

```
POST /api/wishlist/items
```

**Corps de la requête :**
```json
{
  "produit_id": 42,
  "variante_id": 3,
  "note": "J'aime beaucoup ce modèle"
}
```

**Réponse :**
Retourne la liste de souhaits mise à jour avec le même format que `GET /api/wishlist`.

### Supprimer un produit de la liste de souhaits

```
DELETE /api/wishlist/items/{id}
```

**Réponse :**
Retourne la liste de souhaits mise à jour avec le même format que `GET /api/wishlist`.

### Vérifier si un produit est dans la liste de souhaits

```
GET /api/wishlist/check/{produit_id}?variante_id={variante_id}
```

**Paramètres de requête :**
- `variante_id` : Optionnel, ID de la variante du produit

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "in_wishlist": true
  }
}
```

### Déplacer un produit de la liste de souhaits vers le panier

```
POST /api/wishlist/items/{id}/move-to-cart
```

**Corps de la requête :**
```json
{
  "quantite": 1
}
```

**Réponse :**
```json
{
  "status": "success",
  "message": "Produit déplacé vers votre panier",
  "data": {
    "liste_souhait": {
      "liste_souhait": {
        "id": 1,
        "nom": "Ma liste de souhaits",
        "description": null,
        "nombre_items": 0
      },
      "items": []
    },
    "panier": {
      "id": 1,
      "nombre_items": 1,
      "sous_total": 649.99,
      "total": 649.99,
      "items": [
        {
          "id": 1,
          "produit": {
            "id": 42,
            "nom": "Canapé moderne",
            "description": "Canapé confortable et élégant",
            "reference": "1-42",
            "image": "https://example.com/images/canape.jpg",
            "prix": 599.99,
            "en_stock": true,
            "stock_disponible": 10
          },
          "variante": {
            "id": 3,
            "nom": "Canapé moderne - Gris",
            "sku": "1-42-3",
            "prix_supplement": 50,
            "attributs": [
              {
                "nom": "Couleur",
                "valeur": "Gris"
              },
              {
                "nom": "Matière",
                "valeur": "Tissu"
              }
            ]
          },
          "quantite": 1,
          "prix_unitaire": 649.99,
          "prix_total": 649.99
        }
      ]
    }
  }
}
```

## Règles de Validation

### Panier

| Champ | Règles |
|-------|--------|
| produit_id | Requis, existe dans la table produits |
| variante_id | Optionnel, existe dans la table produit_variantes |
| quantite | Requis, entier, minimum 1 |
| guest_cart_id | Requis pour la fusion, existe dans la table paniers |

### Liste de Souhaits

| Champ | Règles |
|-------|--------|
| produit_id | Requis, existe dans la table produits |
| variante_id | Optionnel, existe dans la table produit_variantes |
| note | Optionnel, chaîne, maximum 1000 caractères |
| quantite | Optionnel pour déplacer vers le panier, entier, minimum 1, maximum 100 |

## Considérations Techniques

### Gestion des Sessions

Le système utilise des cookies pour suivre les paniers des utilisateurs non authentifiés. Le cookie `cart_session` est utilisé pour identifier la session du panier.

### Fusion des Paniers

Lorsqu'un utilisateur se connecte, son panier de session peut être fusionné avec son panier existant en utilisant l'endpoint `POST /api/cart/merge`.

### Sécurité

- Les utilisateurs ne peuvent accéder qu'à leur propre panier et liste de souhaits
- La liste de souhaits nécessite une authentification
- Le panier prend en charge à la fois les utilisateurs authentifiés et les sessions invités
