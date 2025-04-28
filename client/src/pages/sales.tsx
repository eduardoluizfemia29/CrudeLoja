import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2, Plus, Minus, Search, Package, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type CartItem = {
  product: Product;
  quantity: number;
};

export default function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const { toast } = useToast();

  // Buscar todos os produtos
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchOnMount: true,
    staleTime: 0,
  });

  // Filtrar apenas produtos com estoque
  const availableProducts = products?.filter(p => p.stock > 0) || [];
  
  // Estado para pesquisa de produtos
  const [searchQuery, setSearchQuery] = useState("");
  
  // Função para verificar se o produto corresponde à busca
  const matchesSearch = (product: Product, search: string) => {
    if (!search || search.trim() === "") return true;
    const searchLower = search.toLowerCase().trim();
    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();
    
    console.log(`Verificando busca: "${searchLower}" em: "${nameLower}" ou "${categoryLower}"`);
    
    return nameLower.includes(searchLower) || categoryLower.includes(searchLower);
  };
  
  // Produtos filtrados pela busca
  const filteredProducts = availableProducts.filter(product => matchesSearch(product, searchQuery));

  // Manipular adição de produto ao carrinho
  const handleAddToCart = () => {
    if (!selectedProductId || !products) return;
    
    const productId = parseInt(selectedProductId);
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    // Verificar estoque disponível
    if (product.stock < quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Disponível apenas ${product.stock} unidades.`,
        variant: "destructive"
      });
      return;
    }
    
    // Verificar se o produto já está no carrinho
    const existingItemIndex = cart.findIndex(item => item.product.id === productId);
    
    if (existingItemIndex >= 0) {
      // Atualizar quantidade se o produto já estiver no carrinho
      const updatedCart = [...cart];
      const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
      
      // Verificar se a nova quantidade excede o estoque
      if (newQuantity > product.stock) {
        toast({
          title: "Estoque insuficiente",
          description: `Disponível apenas ${product.stock} unidades.`,
          variant: "destructive"
        });
        return;
      }
      
      updatedCart[existingItemIndex].quantity = newQuantity;
      setCart(updatedCart);
    } else {
      // Adicionar novo produto ao carrinho
      setCart([...cart, { product, quantity }]);
    }
    
    // Limpar seleções
    setSelectedProductId("");
    setQuantity(1);
    
    toast({
      title: "Produto adicionado",
      description: `${product.name} adicionado ao carrinho.`
    });
  };

  // Manipular remoção de produto do carrinho
  const handleRemoveFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  // Manipular atualização de quantidade no carrinho
  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    const product = cart[index].product;
    
    if (newQuantity <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    
    if (newQuantity > product.stock) {
      toast({
        title: "Estoque insuficiente",
        description: `Disponível apenas ${product.stock} unidades.`,
        variant: "destructive"
      });
      return;
    }
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
  };

  // Calcular valor total da venda
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (Number(item.product.price) * item.quantity);
    }, 0);
  };

  // Mutação para processar a venda, criar registro no sistema e atualizar o estoque
  const processSale = useMutation({
    mutationFn: async (saleData: any) => {
      try {
        // Formato simplificado para o backend
        const saleRequest = {
          clientId: null, // Venda sem cliente associado 
          date: new Date().toISOString(),
          total: saleData.total.toString(),
          items: saleData.items.map((item: CartItem) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
            total: (Number(item.product.price) * item.quantity).toString()
          }))
        };
        
        // 1. Primeiro criar o registro de venda
        const saleResponse = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saleRequest),
        });
        
        if (!saleResponse.ok) {
          console.error('Erro na resposta do servidor:', await saleResponse.text());
          throw new Error('Erro ao criar registro de venda');
        }
        
        const saleResult = await saleResponse.json();
        console.log('Venda registrada:', saleResult);
        
        // 2. Atualizar o estoque de cada produto
        for (const item of saleData.items) {
          const newStock = item.product.stock - item.quantity;
          const updateResponse = await fetch(`/api/products/${item.product.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...item.product,
              stock: newStock
            }),
          });
          
          if (!updateResponse.ok) {
            console.error('Erro ao atualizar produto:', await updateResponse.text());
            throw new Error(`Erro ao atualizar estoque do produto ${item.product.name}`);
          }
        }
        
        return saleResult;
      } catch (error) {
        console.error('Erro ao processar venda:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Limpar carrinho
      setCart([]);
      
      // Invalidar cache para forçar recarregamento dos produtos e vendas
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/summary/daily'] });
      
      toast({
        title: "Venda finalizada com sucesso!",
        description: "Venda registrada no sistema e estoque atualizado."
      });
    },
    onError: (error) => {
      console.error('Erro ao processar venda:', error);
      toast({
        title: "Erro ao finalizar venda",
        description: "Ocorreu um erro ao processar a venda. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Finalizar venda
  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho para finalizar a venda.",
        variant: "destructive"
      });
      return;
    }
    
    const saleData = {
      date: new Date(),
      items: cart,
      total: calculateTotal()
    };
    
    processSale.mutate(saleData);
  };

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Registrar Venda</h2>
        <p className="text-gray-500 mt-1">Adicione produtos e finalize a venda para dar baixa no estoque.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seleção de Produtos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Adicionar Produtos</CardTitle>
            <CardDescription>Pesquise e adicione produtos ao carrinho de compras.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Campo de busca */}
              <div>
                <Label htmlFor="product-search">Buscar Produto</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    placeholder="Buscar por nome ou categoria..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => {
                      console.log("Valor da busca:", e.target.value);
                      setSearchQuery(e.target.value);
                    }}
                  />
                </div>
                
                <div className="mt-3 border rounded-lg shadow-sm max-h-52 overflow-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Nenhum produto encontrado.</div>
                  ) : (
                    <div className="py-2">
                      <div className="px-3 mb-2 text-xs font-medium text-muted-foreground border-b pb-1">
                        Produtos disponíveis ({filteredProducts.length})
                      </div>
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          onClick={() => setSelectedProductId(product.id.toString())}
                          className={`flex justify-between items-center px-3 py-2 cursor-pointer hover:bg-accent/5 ${
                            selectedProductId === product.id.toString() ? 'bg-primary/10' : ''
                          } transition-colors duration-150`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-xs text-muted-foreground">{product.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(Number(product.price))}</div>
                            <Badge variant={product.stock <= (product.minStock || 5) ? "warning" : "success"} className="text-xs">
                              {product.stock} em estoque
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quantidade */}
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-r-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    className="h-10 rounded-none text-center"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10 rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Botão para adicionar ao carrinho */}
              <Button 
                className="w-full mt-6"
                onClick={handleAddToCart}
                disabled={!selectedProductId || quantity < 1 || availableProducts.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar ao Carrinho
              </Button>
            </div>
            
            {/* Produto selecionado */}
            {selectedProductId && products && (
              <div className="mt-4 p-3 border rounded-lg bg-accent/5">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Produto Selecionado:</span>
                </div>
                <div className="mt-2">
                  {(() => {
                    const product = products.find(p => p.id === parseInt(selectedProductId));
                    return product ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(Number(product.price))}</p>
                          <Badge variant={product.stock <= (product.minStock || 5) ? "warning" : "success"} className="text-xs">
                            {product.stock} em estoque
                          </Badge>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Resumo do Carrinho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Carrinho
            </CardTitle>
            <CardDescription>
              {cart.length} {cart.length === 1 ? 'item' : 'itens'} no carrinho
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length > 0 ? (
              <>
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(Number(item.product.price))} x {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border rounded">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveFromCart(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-2 border-t">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Carrinho vazio
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleFinalizeSale}
              disabled={cart.length === 0 || processSale.isPending}
            >
              {processSale.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Finalizar Venda</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Confirmação de venda concluída */}
      {processSale.isSuccess && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-green-700">Venda Finalizada com Sucesso!</h3>
              <p className="text-green-600 mt-2">
                Os produtos foram baixados do estoque automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}