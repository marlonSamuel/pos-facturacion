import { createContext, useState } from 'react';

export interface IBreadCrumb {
  path: string;
  name: string;
  last: boolean;
  icon?: React.ReactNode;
}

export interface UIContextProps {
  loading: boolean;
  setLoading: (action: boolean) => void;
  routesBC: IBreadCrumb[];
  setRoutesBC: (action: IBreadCrumb[]) => void;
}

export const UIContext = createContext({} as UIContextProps);

export const UIProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);
  const [routesBC, setRoutesBC] = useState<IBreadCrumb[]>([]);

  return (
    <UIContext.Provider value={{
      loading,
      setLoading,
      routesBC,
      setRoutesBC
    }}>
      {children}
    </UIContext.Provider>
  );
};
