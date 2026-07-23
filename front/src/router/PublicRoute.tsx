import { Navigate } from 'react-router-dom';

interface Props {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

export const PublicRoute = ({ isAuthenticated, children }: Props) => {
  return isAuthenticated
    ? <Navigate to="/" />
    : <>{children}</>;
};
