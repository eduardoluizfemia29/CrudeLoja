import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

type UseSearchProps<T> = {
  queryKey: string;
  searchQuery: string;
  initialData?: T[];
  debounceMs?: number;
};

export function useSearch<T>({
  queryKey,
  searchQuery,
  initialData = [],
  debounceMs = 300
}: UseSearchProps<T>) {
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  // Update debounced value after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, debounceMs);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debounceMs]);
  
  // Preparar URL com parâmetro de busca se necessário
  const url = debouncedSearchQuery 
    ? `${queryKey}?search=${encodeURIComponent(debouncedSearchQuery)}` 
    : queryKey;
  
  const { data, isLoading, error, refetch } = useQuery<T[]>({
    queryKey: [queryKey, debouncedSearchQuery], // Use queryKey and searchQuery separately for stable caching
    queryFn: async () => {
      console.log("Fazendo requisição para:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const result = await response.json();
      console.log("Dados recebidos:", result);
      return result;
    },
    initialData: initialData,
    staleTime: 0, // Sempre considerar os dados obsoletos para forçar uma busca inicial
    refetchOnMount: true, // Refaz a consulta quando o componente é montado
    refetchOnWindowFocus: false, // Não refaz a consulta quando a janela recebe foco
  });
  
  const refreshData = useCallback(() => {
    console.log("Atualizando dados...");
    refetch();
  }, [refetch]);
  
  return {
    data: data || [],
    isLoading,
    error,
    refreshData
  };
}
