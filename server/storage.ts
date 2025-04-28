import { 
  clients, type Client, type InsertClient,
  products, type Product, type InsertProduct
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
