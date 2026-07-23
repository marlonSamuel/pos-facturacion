import { useState, useEffect } from 'react';
import { personService } from '../services/personService';

export function usePersonas(tipo: string) {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { personService.getAll(tipo as any).then(setList).catch(() => {}); }, [tipo]);
  return list;
}
