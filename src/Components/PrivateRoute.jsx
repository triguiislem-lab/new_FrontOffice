import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext.jsx';

const PrivateRoute = ({ children, requiredRoles = [] }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Affiche un loader pendant la vérification de l'authentification
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-xl">Chargement ... </div>
            </div>
        );
    }

    // Redirige vers la page de login si non authentifié
    if (!isAuthenticated) {
        // Sauvegarde la page demandée pour y revenir après login
        return <Navigate to="/acces-refuse" state={{ from: location }} replace />;
    }

    // Vérifie les rôles si nécessaire
    if (requiredRoles.length > 0 && !requiredRoles.some(role => user.roles.includes(role))) {
        return <Navigate to="/acces-refuse" replace />;
    }

    return children;
};

export default PrivateRoute;