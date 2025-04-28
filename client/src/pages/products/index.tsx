import { useState } from "react";
import { useSearch } from "@/hooks/use-search";
import { Product, CATEGORY_LOW_STOCK_THRESHOLDS } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import ProductForm from "./product-form";
import DeleteConfirmation from "./delete-confirmation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: products, isLoading, refreshData } = useSearch<Product>({
    queryKey: '/api/products',
    searchQuery
  });

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleProductSaved = () => {
    setShowForm(false);
    refreshData();
    toast({
      title: "Produto salvo",
      description: "Produto salvo com sucesso!"
    });
  };

  const handleProductDeleted = () => {
    setShowDeleteConfirm(false);
    refreshData();
    toast({
      title: "Produto excluído",
      description: "Produto excluído com sucesso!"
    });
  };

  const getStockBadge = (stock: number, category: string) => {
    // Obter o limite de estoque baixo com base na categoria
    const lowStockThreshold = CATEGORY_LOW_STOCK_THRESHOLDS[category.toLowerCase()] || 5;
    
    if (stock === 0) {
      return <Badge variant="danger">Sem estoque</Badge>;
    } else if (stock <= lowStockThreshold) {
      return <Badge variant="warning">Estoque baixo: {stock}</Badge>;
    } else {
      return <Badge variant="success">Em estoque: {stock}</Badge>;
    }
  };

  const columns: Column<Product>[] = [
    {
      header: "Produto",
      accessor: (row: Product) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500 truncate max-w-xs">{row.description}</div>
          </div>
        </div>
      )
    },
    {
      header: "Categoria",
      accessor: (row: Product) => row.category
    },
    {
      header: "Preço",
      accessor: "price",
      cell: (value: number) => (
        <span className="font-medium text-gray-900">{formatCurrency(Number(value))}</span>
      ),
    },
    {
      header: "Estoque",
      accessor: "stock",
      cell: (value: number, row: Product) => getStockBadge(value, row.category),
    },
    {
      header: "Última Atualização",
      accessor: "updatedAt",
      cell: (value: string) => formatDate(value),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
        
        <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
          <div className="relative rounded-md shadow-sm flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <Button onClick={handleAddProduct}>
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Novo Produto
          </Button>
        </div>
      </div>
      
      <div className="mt-4">
        <DataTable
          data={products}
          columns={columns}
          keyExtractor={(row) => row.id}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          rowsPerPage={10}
          currentPage={1}
          totalItems={products.length}
        />
      </div>

      {/* Product Form Dialog */}
      {showForm && (
        <ProductForm
          product={selectedProduct}
          onClose={() => setShowForm(false)}
          onSaved={handleProductSaved}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedProduct && (
        <DeleteConfirmation
          itemId={selectedProduct.id}
          itemName={selectedProduct.name}
          itemType="product"
          onClose={() => setShowDeleteConfirm(false)}
          onDeleted={handleProductDeleted}
        />
      )}
    </div>
  );
}
