import MedicoDrawer from './MedicoDrawer';
import AdminDrawer from './AdminDrawer';
import EstudiosDrawer from './EstudiosDrawer';
import { useAuth } from '../context/AuthContext';

export default function AppNavigator() {
  const { user } = useAuth();

  if (!user) return <AuthNavigator />;

  switch (user.role) {
    case 'medico':
      return <MedicoDrawer />;
    case 'admin':
      return <AdminDrawer />;
    case 'estudios':
      return <EstudiosDrawer />;
    default:
      return <AuthNavigator />;
  }
}