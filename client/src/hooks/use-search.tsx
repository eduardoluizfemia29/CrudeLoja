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
      return response.json();
    },
    enabled: true,
    initialData: initialData,
  });
  
  const refreshData = useCallback(() => {
    refetch();
  }, [refetch]);
  
  return {
    data: data || [],
    isLoading,
    error,
    refreshData
  };
}
