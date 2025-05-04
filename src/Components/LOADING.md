# Guide des Animations de Chargement

Ce document décrit les composants et utilitaires de chargement standardisés disponibles dans l'application.

## Composants de Base

### LoadingSpinner

Le composant principal pour toutes les animations de chargement.

```jsx
import LoadingSpinner from './Components/LoadingSpinner';

// Utilisation basique
<LoadingSpinner />

// Avec options
<LoadingSpinner
  size="md"               // xs, sm, md, lg, xl
  color="#A67B5B"         // Couleur personnalisée
  variant="circle"        // circle, dots, pulse
  fullScreen={false}      // Affichage en plein écran
  overlay={false}         // Affichage en superposition
  message="Chargement..." // Message optionnel
/>
```

### EnhancedLazyImage

Composant pour le chargement optimisé des images avec animation de chargement standardisée.

```jsx
import EnhancedLazyImage from './Components/EnhancedLazyImage';

<EnhancedLazyImage
  src="chemin/vers/image.jpg"
  alt="Description de l'image"
  fallbackSrc="chemin/vers/image-fallback.jpg"
  className="h-40 w-full rounded"
  spinnerVariant="circle" // circle, dots, pulse
/>
```

## Utilitaires de Chargement

Des composants prêts à l'emploi pour différents contextes de chargement.

```jsx
import {
  FullPageLoading,
  SectionLoading,
  InlineLoading,
  ButtonLoading,
  CardLoading,
  TableLoading
} from '../utils/loadingUtils.jsx';
```

### FullPageLoading

Pour les chargements en plein écran.

```jsx
<FullPageLoading message="Chargement de la page..." variant="circle" />
```

### SectionLoading

Pour les sections de page en chargement.

```jsx
<SectionLoading height="h-40" message="Chargement de la section..." variant="circle" />
```

### InlineLoading

Pour les chargements en ligne de texte.

```jsx
<div className="flex items-center space-x-2">
  <span>Chargement des données</span>
  <InlineLoading size="xs" variant="dots" />
</div>
```

### ButtonLoading

Pour les boutons en état de chargement.

```jsx
<button className="px-4 py-2 bg-primary text-white rounded">
  {isLoading ? <ButtonLoading text="Envoi en cours..." /> : "Envoyer"}
</button>
```

### CardLoading

Pour les cartes de produits ou d'articles en chargement.

```jsx
<CardLoading height="h-40" variant="circle" />
```

### TableLoading

Pour les tableaux de données en chargement.

```jsx
<TableLoading rows={5} cols={4} />
```

## Exemples d'Utilisation

### Dans un composant React

```jsx
const MyComponent = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un chargement
    setTimeout(() => setLoading(false), 2000);
  }, []);

  if (loading) {
    return <SectionLoading message="Chargement des données..." />;
  }

  return (
    <div>Contenu chargé</div>
  );
};
```

### Avec une requête API

```jsx
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Nos Produits</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, index) => (
            <CardLoading key={index} height="h-64" variant="circle" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nos Produits</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
```

## Démos

Vous pouvez voir des exemples de tous les composants de chargement aux URLs suivantes:

- `/loading-demo` - Démo des variantes du LoadingSpinner
- `/loading-utils` - Démo des utilitaires de chargement
