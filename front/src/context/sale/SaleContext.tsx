import { createContext, useCallback, useReducer, useState } from 'react';
import type { ICartItemSale } from '../../interfaces/ISale';

interface SaleState {
  items: ICartItemSale[];
}

type SaleAction =
  | { type: 'addItem'; payload: ICartItemSale }
  | { type: 'removeItem'; payload: { idarticulo: number } }
  | { type: 'updateQty'; payload: { idarticulo: number; cantidad: number } }
  | { type: 'updateDiscount'; payload: { idarticulo: number; descuento: number } }
  | { type: 'clear' };

const initialState: SaleState = { items: [] };

const saleReducer = (state: SaleState, action: SaleAction): SaleState => {
  switch (action.type) {
    case 'addItem': {
      const exists = state.items.find(i => i.idarticulo === action.payload.idarticulo);
      if (exists) return state; // No acumular, solo se ajusta desde el carrito
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
            ? { ...i, cantidad: action.payload.cantidad, subtotal: action.payload.cantidad * i.precio_venta - i.descuento }
            : i
        )
      };
    }
    case 'updateDiscount': {
      return {
        items: state.items.map(i =>
          i.idarticulo === action.payload.idarticulo
            ? { ...i, descuento: action.payload.descuento, subtotal: i.cantidad * i.precio_venta - action.payload.descuento }
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

export interface SaleContextProps {
  items: ICartItemSale[];
  addItem: (item: ICartItemSale) => void;
  removeItem: (idarticulo: number) => void;
  updateQty: (idarticulo: number, cantidad: number) => void;
  updateDiscount: (idarticulo: number, descuento: number) => void;
  clear: () => void;
  tipoVenta: 'CA' | 'CR';
  setTipoVenta: (v: 'CA' | 'CR') => void;
  subtotal: number;
  totalImpuesto: number;
  total: number;
  baseImponible: number;
  count: number;
}

export const SaleContext = createContext({} as SaleContextProps);

export const SaleProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(saleReducer, initialState);
  const [tipoVenta, setTipoVenta] = useState<'CA' | 'CR'>('CA');

  const addItem = useCallback((item: ICartItemSale) => dispatch({ type: 'addItem', payload: item }), []);
  const removeItem = useCallback((idarticulo: number) => dispatch({ type: 'removeItem', payload: { idarticulo } }), []);
  const updateQty = useCallback((idarticulo: number, cantidad: number) => dispatch({ type: 'updateQty', payload: { idarticulo, cantidad } }), []);
  const updateDiscount = useCallback((idarticulo: number, descuento: number) => dispatch({ type: 'updateDiscount', payload: { idarticulo, descuento } }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const subtotal = state.items.reduce((sum, i) => sum + i.cantidad * i.precio_venta, 0);
  const total = state.items.reduce((sum, i) => sum + i.subtotal, 0);
  // IVA (12% incluido en precio): base = total / 1.12, iva = total - base
  const baseImponible = total / 1.12;
  const totalImpuesto = Math.round((total - baseImponible) * 100) / 100;
  const count = state.items.length;

  return (
    <SaleContext.Provider value={{ items: state.items, addItem, removeItem, updateQty, updateDiscount, clear, tipoVenta, setTipoVenta, subtotal, totalImpuesto, total, baseImponible, count }}>
      {children}
    </SaleContext.Provider>
  );
};
