import { useState } from "react";
import { Product, productValidationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type ProductFormProps = {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

const PRODUCT_CATEGORIES = [
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "moveis", label: "Móveis" },
  { value: "vestuario", label: "Vestuário" },
  { value: "calcados", label: "Calçados" },
  { value: "decoracao", label: "Decoração" },
  { value: "utilidades", label: "Utilidades Domésticas" },
  { value: "esportes", label: "Esportes" },
  { value: "brinquedos", label: "Brinquedos" },
  { value: "alimentos", label: "Alimentos" },
  { value: "outro", label: "Outro" }
];

export default function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const isEditing = !!product;
  
  const form = useForm({
    resolver: zodResolver(productValidationSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price), // Convert from Decimal to number
      stock: product.stock,
      sku: product.sku || "",
    } : {
      name: "",
      description: "",
      category: "",
      price: 0,
      stock: 0,
      sku: "",
    },
  });

  const saveProduct = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing && product) {
        return await apiRequest('PUT', `/api/products/${product.id}`, data);
      } else {
        return await apiRequest('POST', '/api/products', data);
      }
    },
    onSuccess: () => {
      onSaved();
    },
    onError: (error) => {
      console.error('Error saving product:', error);
    },
  });

  const onSubmit = (data: any) => {
    // Ensure price is sent as a string to match the server's expectation
    // The schema will handle conversion through z.coerce
    const formattedData = {
      ...data,
      price: data.price.toString(),
      stock: Number(data.stock),
    };
    
    saveProduct.mutate(formattedData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do produto"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">R$</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-12"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em Estoque</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Código de referência (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <Button 
                type="submit" 
                disabled={saveProduct.isPending}
                className="w-full sm:ml-3 sm:w-auto"
              >
                {saveProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
