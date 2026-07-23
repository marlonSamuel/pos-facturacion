import { createContext, useCallback, useReducer } from 'react';
import type { ICartItem } from '../../interfaces/IPurchase';

interface ShopState {
  items: ICartItem[];
}

type ShopAction =
  | { type: 'addItem'; payload: ICartItem }
  | { type: 'removeItem'; payload: { idarticulo: number } }
  | { type: 'updateQty'; payload: { idarticulo: number; cantidad: number } }
  | { type: 'clear' };

const initialState: ShopState = { items: [] };

const shopReducer = (state: ShopState, action: ShopAction): ShopState => {
  switch (action.type) {
    case 'addItem': {
      const exists = state.items.find(i => i.idarticulo === action.payload.idarticulo);
      if (exists) {
        return {
          items: state.items.map(i =>
            i.idarticulo === action.payload.idarticulo
              ? { ...i, cantidad: i.cantidad + action.payload.cantidad, subtotal: (i.cantidad + action.payload.cantidad) * i.precio_compra }
              : i
          )
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'removeItem':
      return { items: state.items.filter(i => i.idarticulo !== action.payload.idarticulo) };
    case 'updateQty': {
      if (action.payload.cantidad <= 0) {
        return { items: state.items.filter(i => i.idarticulo !== action.payload.idarticulo) };
      }
      return {
        items: state.items.map(i =>
          i.idarticulo === action.payload.idarticulo
            ? { ...i, cantidad: action.payload.cantidad, subtotal: action.payload.cantidad * i.precio_compra }
            : i
        )
      };
    }
    case 'clear':
      return { items: [] };
    default:
      return state;
  }
};

export interface ShopContextProps {
  items: ICartItem[];
  addItem: (item: ICartItem) => void;
  removeItem: (idarticulo: number) => void;
  updateQty: (idarticulo: number, cantidad: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

export const ShopContext = createContext({} as ShopContextProps);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(shopReducer, initialState);

  const addItem = useCallback((item: ICartItem) => dispatch({ type: 'addItem', payload: item }), []);
  const removeItem = useCallback((idarticulo: number) => dispatch({ type: 'removeItem', payload: { idarticulo } }), []);
  const updateQty = useCallback((idarticulo: number, cantidad: number) => dispatch({ type: 'updateQty', payload: { idarticulo, cantidad } }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const total = state.items.reduce((sum, i) => sum + i.subtotal, 0);
  const count = state.items.length;

  return (
    <ShopContext.Provider value={{ items: state.items, addItem, removeItem, updateQty, clear, total, count }}>
      {children}
    </ShopContext.Provider>
  );
};
