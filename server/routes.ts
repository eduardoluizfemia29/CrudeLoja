import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertProductSchema, insertSaleSchema, products, saleItems, sales } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { db } from "./db";
import { and, eq, gte, lte, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = "/api";

  // Clients routes
  app.get(`${apiPrefix}/clients`, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const clients = await storage.getClients(search);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get(`${apiPrefix}/clients/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post(`${apiPrefix}/clients`, async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error);
        return res.status(400).json({ message: errorMessage.message });
      }
      
      const newClient = await storage.createClient(validatedData.data);
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put(`${apiPrefix}/clients/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertClientSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error);
        return res.status(400).json({ message: errorMessage.message });
      }
      
      const updatedClient = await storage.updateClient(id, validatedData.data);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete(`${apiPrefix}/clients/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Products routes
  app.get(`${apiPrefix}/products`, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const products = await storage.getProducts(search);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get(`${apiPrefix}/products/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post(`${apiPrefix}/products`, async (req: Request, res: Response) => {
    try {
      console.log("Received product data:", req.body);
      const validatedData = insertProductSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error);
        console.log("Validation error:", errorMessage.message);
        return res.status(400).json({ message: errorMessage.message });
      }
      
      const newProduct = await storage.createProduct(validatedData.data);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put(`${apiPrefix}/products/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error);
        return res.status(400).json({ message: errorMessage.message });
      }
      
      const updatedProduct = await storage.updateProduct(id, validatedData.data);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete(`${apiPrefix}/products/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Sales routes
  app.get(`${apiPrefix}/sales`, async (req: Request, res: Response) => {
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const sales = await storage.getSales(startDate, endDate);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get(`${apiPrefix}/sales/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSaleWithItems(id);
      
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post(`${apiPrefix}/sales`, async (req: Request, res: Response) => {
    try {
      console.log('Received sale data:', JSON.stringify(req.body, null, 2));
      
      // Formato direto enviado pelo frontend
      if (req.body.items && Array.isArray(req.body.items)) {
        // Garantir que a data seja um objeto Date válido
        let saleDate: Date;
        try {
          // Se for uma string ISO, converte para Date
          if (typeof req.body.date === 'string') {
            saleDate = new Date(req.body.date);
          } else {
            // Caso contrário, usa a data atual
            saleDate = new Date();
          }
        } catch (e) {
          saleDate = new Date();
        }
        
        const sale = {
          clientId: req.body.clientId === undefined ? null : req.body.clientId,
          date: saleDate,
          total: req.body.total || "0"
        };
        
        // Log para debug
        console.log('Preparando para criar venda:', { 
          sale: {
            ...sale,
            date: sale.date.toISOString() // Só para mostrar no log
          }, 
          itemsCount: req.body.items.length 
        });
        
        if (req.body.items.length === 0) {
          return res.status(400).json({ message: "Sale must have at least one item" });
        }
        
        try {
          const newSale = await storage.createSale(sale, req.body.items);
          console.log('Venda criada com sucesso:', newSale);
          return res.status(201).json(newSale);
        } catch (storageError: any) {
          console.error('Erro no storage ao criar venda:', storageError);
          return res.status(500).json({ message: "Error in storage layer: " + (storageError?.message || 'Unknown error') });
        }
      } 
      // Formato alternativo
      else if (req.body.sale && req.body.items) {
        const { sale, items } = req.body;
        
        // Garantir que a data seja um objeto Date válido
        let saleDate: Date;
        try {
          // Se for uma string ISO, converte para Date
          if (typeof sale.date === 'string') {
            saleDate = new Date(sale.date);
          } else {
            // Caso contrário, usa a data atual
            saleDate = new Date();
          }
        } catch (e) {
          saleDate = new Date();
        }
        
        // Adicionar valores padrão para evitar erros de validação
        const saleWithDefaults = {
          clientId: sale.clientId === undefined ? null : sale.clientId,
          date: saleDate,
          total: sale.total || "0"
        };
        
        // Log para debug
        console.log('Usando formato alternativo, dados preparados:', { 
          sale: {
            ...saleWithDefaults,
            date: saleWithDefaults.date.toISOString() // Só para mostrar no log
          }, 
          itemsCount: items?.length || 0 
        });
        
        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: "Sale must have at least one item" });
        }
        
        try {
          const newSale = await storage.createSale(saleWithDefaults, items);
          console.log('Venda criada com sucesso:', newSale);
          return res.status(201).json(newSale);
        } catch (storageError: any) {
          console.error('Erro no storage ao criar venda:', storageError);
          return res.status(500).json({ message: "Error in storage layer: " + (storageError?.message || 'Unknown error') });
        }
      } else {
        console.error('Formato de dados inválido:', req.body);
        return res.status(400).json({ message: "Invalid sale data format" });
      }
    } catch (error: any) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale: " + (error?.message || 'Unknown error') });
    }
  });

  app.get(`${apiPrefix}/sales/summary/daily`, async (req: Request, res: Response) => {
    try {
      let startDate = new Date();
      let endDate = new Date();
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      } else {
        // Default to 30 days ago
        startDate.setDate(startDate.getDate() - 30);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      // Get daily summary
      const summary = await storage.getSalesSummaryByDay(startDate, endDate);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching sales summary:", error);
      res.status(500).json({ message: "Failed to fetch sales summary" });
    }
  });

  // Rota para buscar todos os itens de venda em um período
  app.get(`${apiPrefix}/sale-items`, async (req: Request, res: Response) => {
    try {
      let startDate = new Date();
      let endDate = new Date();
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      } else {
        // Default to 30 days ago
        startDate.setDate(startDate.getDate() - 30);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      // Buscar todos os itens de venda diretamente
      const items = await db.select({
        id: saleItems.id,
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        total: saleItems.total,
        productName: products.name,
        productPrice: products.price
      })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(
        gte(sales.date, startDate),
        lte(sales.date, endDate)
      ))
      .execute();
      
      res.json(items);
    } catch (error: any) {
      console.error("Error fetching sale items:", error);
      res.status(500).json({ message: "Failed to fetch sale items: " + (error?.message || 'Unknown error') });
    }
  });
  
  // Manter a rota anterior para compatibilidade, mas redirecionando
  app.get(`${apiPrefix}/sales/items`, async (req: Request, res: Response) => {
    try {
      // Redirecionar para a nova rota
      const startDate = req.query.startDate ? req.query.startDate as string : undefined;
      const endDate = req.query.endDate ? req.query.endDate as string : undefined;
      
      // Construir query params
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      // Redirecionar
      return res.redirect(`${apiPrefix}/sale-items${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    } catch (error: any) {
      console.error("Error redirecting:", error);
      res.status(500).json({ message: "Failed to redirect: " + (error?.message || 'Unknown error') });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
