import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Client, Product, DEFAULT_MIN_STOCK } from "@shared/schema";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Calculate stats
  const totalClients = clients?.length || 0;
  const totalProducts = products?.length || 0;
  
  // Contagem de produtos com estoque baixo usando limites específicos para cada produto
  const lowStockProducts = products?.filter(product => {
    if (product.stock === 0) return false; // Sem estoque é uma categoria diferente
    const minStock = product.minStock || DEFAULT_MIN_STOCK;
    return product.stock <= minStock;
  }).length || 0;
  
  const outOfStockProducts = products?.filter(p => p.stock === 0).length || 0;
  
  // Calculate total inventory value
  const inventoryValue = products?.reduce((total, product) => {
    return total + (Number(product.price) * product.stock);
  }, 0) || 0;

  if (isLoadingClients || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClients}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{lowStockProducts}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Produtos Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Valor Total do Inventário</CardTitle>
            <CardDescription>Valor total de todos os produtos em estoque</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatCurrency(inventoryValue)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Clientes Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {clients && clients.length > 0 ? (
              <ul className="space-y-2">
                {clients.slice(0, 5).map((client) => (
                  <li key={client.id} className="p-2 hover:bg-gray-50 rounded">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nenhum cliente cadastrado</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            {products && products.some(product => {
              if (product.stock === 0) return true;
              const minStock = product.minStock || DEFAULT_MIN_STOCK;
              return product.stock <= minStock;
            }) ? (
              <ul className="space-y-2">
                {products
                  .filter(product => {
                    if (product.stock === 0) return true;
                    const minStock = product.minStock || DEFAULT_MIN_STOCK;
                    return product.stock <= minStock;
                  })
                  .slice(0, 5)
                  .map((product) => {
                    const minStock = product.minStock || DEFAULT_MIN_STOCK;
                    return (
                      <li key={product.id} className="p-2 hover:bg-gray-50 rounded flex justify-between items-center">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                        <div className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {product.stock === 0 ? 'Sem estoque' : `Estoque: ${product.stock}/${minStock}`}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="text-gray-500">Todos os produtos têm estoque suficiente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
