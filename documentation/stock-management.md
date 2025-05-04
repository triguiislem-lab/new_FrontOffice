# Gestion des Stocks

Ce document décrit le système de gestion des stocks implémenté dans l'API Laravel.

## Fonctionnalités

Le système de gestion des stocks offre les fonctionnalités suivantes :

1. **Suivi des mouvements de stock** : Chaque modification de stock est enregistrée avec des informations détaillées
2. **Différents types de mouvements** : Entrées, sorties, ajustements, commandes et retours
3. **Historique complet** : Consultation de l'historique des mouvements pour chaque produit
4. **Alertes de stock** : Identification des produits en rupture ou en stock limité
5. **Validation des opérations** : Vérification de la disponibilité du stock avant les retraits

## Modèles de données

### StockHistorique

Le modèle `StockHistorique` enregistre chaque mouvement de stock avec les informations suivantes :

| Champ | Type | Description |
|-------|------|-------------|
| id | int | Identifiant unique |
| produit_id | int | ID du produit concerné |
| quantite_avant | int | Quantité en stock avant le mouvement |
| quantite_apres | int | Quantité en stock après le mouvement |
| quantite_modifiee | int | Différence entre avant et après (positive pour ajout, négative pour retrait) |
| type_mouvement | string | Type de mouvement (entrée, sortie, ajustement, commande, retour) |
| reference_mouvement | string | Référence externe (numéro de commande, etc.) |
| user_id | int | ID de l'utilisateur ayant effectué l'opération |
| commentaire | text | Commentaire sur le mouvement |
| created_at | datetime | Date et heure de création |
| updated_at | datetime | Date et heure de mise à jour |

## Types de mouvements

Le système prend en charge les types de mouvements suivants :

- **Entrée** (`entree`) : Ajout de stock (réception de marchandises, etc.)
- **Sortie** (`sortie`) : Retrait de stock (prélèvement manuel, etc.)
- **Ajustement** (`ajustement`) : Modification directe du niveau de stock (inventaire, correction, etc.)
- **Commande** (`commande`) : Retrait de stock lié à une commande client
- **Retour** (`retour`) : Ajout de stock lié à un retour client

## API Endpoints

### Historique des mouvements

```
GET /api/stock/produits/{produitId}/historique
```

Récupère l'historique des mouvements de stock pour un produit spécifique.

**Paramètres de requête :**
- `page` : Numéro de page pour la pagination (par défaut : 1)
- `per_page` : Nombre d'éléments par page (par défaut : 15)

**Réponse :**
```json
{
  "produit": {
    "id": 1,
    "nom": "Nom du produit",
    "reference": "REF123",
    "quantite_actuelle": 25,
    "en_stock": true,
    "stock_limite": false
  },
  "historique": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "produit_id": 1,
        "quantite_avant": 20,
        "quantite_apres": 25,
        "quantite_modifiee": 5,
        "type_mouvement": "entree",
        "reference_mouvement": "LIVRAISON-123",
        "user_id": 1,
        "commentaire": "Réception de marchandises",
        "created_at": "2025-04-22T21:30:00.000000Z",
        "updated_at": "2025-04-22T21:30:00.000000Z",
        "user": {
          "id": 1,
          "name": "Admin"
        }
      }
    ],
    "first_page_url": "...",
    "from": 1,
    "last_page": 1,
    "last_page_url": "...",
    "links": [...],
    "next_page_url": null,
    "path": "...",
    "per_page": 15,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

### Ajouter du stock

```
POST /api/stock/produits/{produitId}/ajouter
```

Ajoute une quantité spécifiée au stock d'un produit.

**Corps de la requête :**
```json
{
  "quantite": 10,
  "reference": "LIVRAISON-123",
  "commentaire": "Réception de marchandises"
}
```

**Paramètres :**
- `quantite` (obligatoire) : Quantité à ajouter (doit être positive)
- `reference` (optionnel) : Référence externe du mouvement
- `commentaire` (optionnel) : Commentaire sur le mouvement

**Réponse :**
```json
{
  "message": "Stock ajouté avec succès",
  "produit": {
    "id": 1,
    "nom": "Nom du produit",
    "quantite_precedente": 15,
    "quantite_actuelle": 25,
    "quantite_ajoutee": 10
  },
  "mouvement": {
    "id": 1,
    "produit_id": 1,
    "quantite_avant": 15,
    "quantite_apres": 25,
    "quantite_modifiee": 10,
    "type_mouvement": "entree",
    "reference_mouvement": "LIVRAISON-123",
    "user_id": 1,
    "commentaire": "Réception de marchandises",
    "created_at": "2025-04-22T21:30:00.000000Z",
    "updated_at": "2025-04-22T21:30:00.000000Z"
  }
}
```

### Retirer du stock

```
POST /api/stock/produits/{produitId}/retirer
```

Retire une quantité spécifiée du stock d'un produit.

**Corps de la requête :**
```json
{
  "quantite": 5,
  "reference": "SORTIE-456",
  "commentaire": "Prélèvement pour exposition"
}
```

**Paramètres :**
- `quantite` (obligatoire) : Quantité à retirer (doit être positive)
- `reference` (optionnel) : Référence externe du mouvement
- `commentaire` (optionnel) : Commentaire sur le mouvement

**Réponse :**
```json
{
  "message": "Stock retiré avec succès",
  "produit": {
    "id": 1,
    "nom": "Nom du produit",
    "quantite_precedente": 25,
    "quantite_actuelle": 20,
    "quantite_retiree": 5
  },
  "mouvement": {
    "id": 2,
    "produit_id": 1,
    "quantite_avant": 25,
    "quantite_apres": 20,
    "quantite_modifiee": -5,
    "type_mouvement": "sortie",
    "reference_mouvement": "SORTIE-456",
    "user_id": 1,
    "commentaire": "Prélèvement pour exposition",
    "created_at": "2025-04-22T21:35:00.000000Z",
    "updated_at": "2025-04-22T21:35:00.000000Z"
  }
}
```

### Ajuster le stock

```
POST /api/stock/produits/{produitId}/ajuster
```

Ajuste le stock d'un produit à une valeur spécifique.

**Corps de la requête :**
```json
{
  "quantite": 18,
  "commentaire": "Ajustement après inventaire"
}
```

**Paramètres :**
- `quantite` (obligatoire) : Nouvelle quantité totale (doit être positive ou zéro)
- `commentaire` (optionnel) : Commentaire sur l'ajustement

**Réponse :**
```json
{
  "message": "Stock ajusté avec succès",
  "produit": {
    "id": 1,
    "nom": "Nom du produit",
    "quantite_precedente": 20,
    "quantite_actuelle": 18,
    "difference": -2
  },
  "mouvement": {
    "id": 3,
    "produit_id": 1,
    "quantite_avant": 20,
    "quantite_apres": 18,
    "quantite_modifiee": -2,
    "type_mouvement": "ajustement",
    "reference_mouvement": null,
    "user_id": 1,
    "commentaire": "Ajustement après inventaire",
    "created_at": "2025-04-22T21:40:00.000000Z",
    "updated_at": "2025-04-22T21:40:00.000000Z"
  }
}
```

### Produits en rupture de stock

```
GET /api/stock/ruptures
```

Récupère la liste des produits en rupture de stock (quantité <= 0).

**Réponse :**
```json
{
  "count": 2,
  "produits": [
    {
      "id": 2,
      "nom": "Produit en rupture 1",
      "reference": "REF456",
      "quantite": 0,
      "marque": "Marque A",
      "image": "https://example.com/image1.jpg"
    },
    {
      "id": 3,
      "nom": "Produit en rupture 2",
      "reference": "REF789",
      "quantite": 0,
      "marque": "Marque B",
      "image": "https://example.com/image2.jpg"
    }
  ]
}
```

### Produits en stock limité

```
GET /api/stock/limites
```

Récupère la liste des produits en stock limité (quantité > 0 et <= seuil).

**Paramètres de requête :**
- `seuil` : Seuil en dessous duquel le stock est considéré comme limité (par défaut : 5)

**Réponse :**
```json
{
  "count": 1,
  "seuil": 5,
  "produits": [
    {
      "id": 4,
      "nom": "Produit en stock limité",
      "reference": "REF101",
      "quantite": 3,
      "marque": "Marque C",
      "image": "https://example.com/image3.jpg"
    }
  ]
}
```

## Intégration avec d'autres systèmes

### Commandes

Lorsqu'une commande est créée, le système peut automatiquement mettre à jour le stock des produits concernés en utilisant le service `StockService` :

```php
// Dans le contrôleur de commandes
$stockService->retirerStockCommande($produitId, $quantite, $commande->reference);
```

### Retours

De même, lorsqu'un retour est traité, le stock peut être mis à jour :

```php
// Dans le contrôleur de retours
$stockService->ajouterStockRetour($produitId, $quantite, $retour->reference, "Retour client");
```

## Bonnes pratiques

1. **Toujours utiliser le service** : Utilisez toujours le `StockService` pour modifier les stocks afin de garantir la cohérence des données et l'enregistrement de l'historique.

2. **Transactions** : Les opérations de stock sont exécutées dans des transactions pour garantir l'intégrité des données.

3. **Vérification du stock** : Avant de retirer du stock, vérifiez toujours qu'il y a suffisamment de stock disponible.

4. **Alertes** : Utilisez les endpoints `/api/stock/ruptures` et `/api/stock/limites` pour surveiller les niveaux de stock et anticiper les réapprovisionnements.
