import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Client, Product } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const getStockBadge = (stock: number, row: Product) => {
    // Obter o limite de estoque baixo do próprio produto
    const minStock = row.minStock || 5;
    
    if (stock === 0) {
      return <Badge variant="danger">Sem estoque</Badge>;
    } else if (stock <= minStock) {
      return <Badge variant="warning">Estoque baixo: {stock}/{minStock}</Badge>;
    } else {
      return <Badge variant="success">Em estoque: {stock}</Badge>;
    }
  };

  const clientColumns = [
    {
      header: "Nome",
      accessor: (row: Client) => row.name,
      cell: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      header: "Email",
      accessor: (row: Client) => row.email
    },
    {
      header: "Telefone",
      accessor: (row: Client) => row.phone
    },
    {
      header: "Cidade/Estado",
      accessor: (row: Client) => `${row.city}/${row.state}`
    },
    {
      header: "Último Pedido",
      accessor: (row: Client) => formatDate(row.lastOrderDate),
    },
  ];

  const productColumns = [
    {
      header: "Produto",
      accessor: (row: Product) => row.name,
      cell: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      header: "Categoria",
      accessor: (row: Product) => row.category
    },
    {
      header: "Preço",
      accessor: (row: Product) => row.price,
      cell: (value: string) => formatCurrency(Number(value)),
    },
    {
      header: "Estoque",
      accessor: (row: Product) => row.stock,
      cell: (value: number, row: Product) => (
        <div className="flex items-center">
          {getStockBadge(value, row)}
        </div>
      ),
    },
    {
      header: "Valor Total",
      accessor: (row: Product) => formatCurrency(Number(row.price) * row.stock),
    },
  ];

  if (isLoadingClients || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate total inventory value
  const inventoryValue = products?.reduce((total, product) => {
    return total + (Number(product.price) * product.stock);
  }, 0) || 0;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h2>
      
      <Tabs defaultValue="inventory" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumo do Inventário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total de Produtos</p>
                  <p className="text-2xl font-bold">{products?.length || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Produtos Sem Estoque</p>
                  <p className="text-2xl font-bold text-red-600">
                    {products?.filter(p => p.stock === 0).length || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Valor Total do Inventário</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(inventoryValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Lista de Produtos</h3>
            <DataTable
              data={products || []}
              columns={productColumns}
              keyExtractor={(row) => row.id}
              rowsPerPage={10}
              currentPage={1}
              totalItems={products?.length || 0}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="clients">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumo de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total de Clientes</p>
                  <p className="text-2xl font-bold">{clients?.length || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Cidades Atendidas</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Set(clients?.map(c => c.city)).size || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Lista de Clientes</h3>
            <DataTable
              data={clients || []}
              columns={clientColumns}
              keyExtractor={(row) => row.id}
              rowsPerPage={10}
              currentPage={1}
              totalItems={clients?.length || 0}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
