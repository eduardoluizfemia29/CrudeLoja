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
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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

  // Mutação para processar a venda e atualizar o estoque
  const processSale = useMutation({
    mutationFn: async (saleData: any) => {
      // Em um sistema real, aqui enviaria para o backend
      // Por enquanto, vamos atualizar apenas o estoque de cada produto
      
      const updatePromises = saleData.items.map((item: any) => {
        const newStock = item.product.stock - item.quantity;
        return apiRequest('PUT', `/api/products/${item.product.id}`, {
          ...item.product,
          stock: newStock
        });
      });
      
      return Promise.all(updatePromises);
    },
    onSuccess: () => {
      // Limpar carrinho
      setCart([]);
      
      // Invalidar cache para forçar recarregamento dos produtos
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Venda finalizada com sucesso!",
        description: "Os produtos foram baixados do estoque."
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
            <CardDescription>Selecione os produtos para adicionar ao carrinho.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="product-select">Produto</Label>
                <Select 
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.length > 0 ? (
                      availableProducts.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {formatCurrency(Number(product.price))} - ({product.stock} em estoque)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Sem produtos disponíveis</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
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
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={handleAddToCart}
              disabled={!selectedProductId || quantity < 1 || availableProducts.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar ao Carrinho
            </Button>
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
      
      {/* Detalhe dos Produtos Disponíveis */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Produtos Disponíveis para Venda</CardTitle>
          <CardDescription>Lista de todos os produtos com estoque disponível.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de produtos disponíveis para venda.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableProducts.length > 0 ? (
                availableProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatCurrency(Number(product.price))}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock <= (product.minStock || 5) ? "warning" : "success"}>
                        {product.stock} unid.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedProductId(product.id.toString());
                          setQuantity(1);
                          const element = document.querySelector('#product-select');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Não há produtos disponíveis no estoque.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}