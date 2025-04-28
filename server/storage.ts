import { 
  clients, type Client, type InsertClient,
  products, type Product, type InsertProduct,
  sales, type Sale, type InsertSale,
  saleItems, type SaleItem, type InsertSaleItem
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, between, desc, sql, and, gte, lte } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Client operations
  getClients(search?: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Product operations
  getProducts(search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: InsertProduct): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Sales operations
  getSales(startDate?: Date, endDate?: Date): Promise<Sale[]>;
  getSaleWithItems(id: number): Promise<{ sale: Sale, items: (SaleItem & { product: Product })[] } | undefined>;
  createSale(sale: InsertSale, items: Omit<InsertSaleItem, "saleId">[]): Promise<Sale>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  getSalesSummaryByDay(startDate: Date, endDate: Date): Promise<{ date: string, total: number, count: number }[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Client operations
  async getClients(search?: string): Promise<Client[]> {
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      return db.select()
        .from(clients)
        .where(or(
          ilike(clients.name, searchLower),
          ilike(clients.email, searchLower),
          ilike(clients.phone, searchLower),
          ilike(clients.address, searchLower),
          ilike(clients.city, searchLower)
        ))
        .execute();
    }
    
    return db.select().from(clients).execute();
  }

  async getClient(id: number): Promise<Client | undefined> {
    const results = await db.select()
      .from(clients)
      .where(eq(clients.id, id))
      .execute();
    
    return results.length > 0 ? results[0] : undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const now = new Date();
    const [newClient] = await db.insert(clients)
      .values({ ...client, lastOrderDate: now })
      .returning();
    
    return newClient;
  }

  async updateClient(id: number, client: InsertClient): Promise<Client | undefined> {
    const [updatedClient] = await db.update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients)
      .where(eq(clients.id, id))
      .returning({ id: clients.id });
    
    return result.length > 0;
  }

  // Product operations
  async getProducts(search?: string): Promise<Product[]> {
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      return db.select()
        .from(products)
        .where(or(
          ilike(products.name, searchLower),
          ilike(products.description, searchLower),
          ilike(products.category, searchLower),
          ilike(products.sku || '', searchLower)
        ))
        .execute();
    }
    
    return db.select().from(products).execute();
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const results = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .execute();
    
    return results.length > 0 ? results[0] : undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const now = new Date();
    const [newProduct] = await db.insert(products)
      .values({ ...product, updatedAt: now })
      .returning();
    
    return newProduct;
  }

  async updateProduct(id: number, product: InsertProduct): Promise<Product | undefined> {
    const now = new Date();
    const [updatedProduct] = await db.update(products)
      .set({ ...product, updatedAt: now })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    
    return result.length > 0;
  }

  // Sales operations
  async getSales(startDate?: Date, endDate?: Date): Promise<Sale[]> {
    if (startDate && endDate) {
      return db.select()
        .from(sales)
        .where(and(
          gte(sales.date, startDate),
          lte(sales.date, endDate)
        ))
        .orderBy(desc(sales.date))
        .execute();
    }
    
    return db.select()
      .from(sales)
      .orderBy(desc(sales.date))
      .execute();
  }

  async getSaleWithItems(id: number): Promise<{ sale: Sale, items: (SaleItem & { product: Product })[] } | undefined> {
    const result = await db.select()
      .from(sales)
      .where(eq(sales.id, id))
      .execute();

    if (result.length === 0) {
      return undefined;
    }

    const sale = result[0];
    
    const items = await db.select({
      ...saleItems,
      product: products
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(eq(saleItems.saleId, id))
    .execute();

    return {
      sale,
      items
    };
  }

  async createSale(sale: InsertSale, items: Omit<InsertSaleItem, "saleId">[]): Promise<Sale> {
    // Use a transaction to ensure atomicity
    return db.transaction(async (tx) => {
      // Insert the sale
      const [newSale] = await tx.insert(sales)
        .values(sale)
        .returning();
      
      // Insert all items
      if (items.length > 0) {
        await tx.insert(saleItems)
          .values(
            items.map(item => ({
              ...item,
              saleId: newSale.id
            }))
          );
        
        // Update product stock
        for (const item of items) {
          await tx.update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`
            })
            .where(eq(products.id, item.productId));
        }
        
        // Update client's last order date if client is specified
        if (newSale.clientId) {
          await tx.update(clients)
            .set({
              lastOrderDate: newSale.date
            })
            .where(eq(clients.id, newSale.clientId));
        }
      }
      
      return newSale;
    });
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return db.select()
      .from(sales)
      .where(and(
        gte(sales.date, startDate),
        lte(sales.date, endDate)
      ))
      .orderBy(desc(sales.date))
      .execute();
  }

  async getSalesSummaryByDay(startDate: Date, endDate: Date): Promise<{ date: string, total: number, count: number }[]> {
    const result = await db.select({
      date: sql`DATE(${sales.date})::text`,
      total: sql`SUM(${sales.total})`,
      count: sql`COUNT(${sales.id})`
    })
    .from(sales)
    .where(and(
      gte(sales.date, startDate),
      lte(sales.date, endDate)
    ))
    .groupBy(sql`DATE(${sales.date})`)
    .orderBy(sql`DATE(${sales.date})`)
    .execute();
    
    return result;
  }
}

export const storage = new DatabaseStorage();
