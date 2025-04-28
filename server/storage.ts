import { 
  clients, type Client, type InsertClient,
  products, type Product, type InsertProduct
} from "@shared/schema";

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

// In-memory storage implementation
export class MemStorage implements IStorage {
  private clients: Map<number, Client>;
  private products: Map<number, Product>;
  private clientId: number;
  private productId: number;

  constructor() {
    this.clients = new Map();
    this.products = new Map();
    this.clientId = 1;
    this.productId = 1;
  }

  // Client operations
  async getClients(search?: string): Promise<Client[]> {
    let result = Array.from(this.clients.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(client => 
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.toLowerCase().includes(searchLower) ||
        client.address.toLowerCase().includes(searchLower) ||
        client.city.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const now = new Date();
    const newClient: Client = { ...client, id, lastOrderDate: now };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, client: InsertClient): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    
    if (!existingClient) {
      return undefined;
    }
    
    const updatedClient: Client = { 
      ...existingClient, 
      ...client
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Product operations
  async getProducts(search?: string): Promise<Product[]> {
    let result = Array.from(this.products.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower))
      );
    }
    
    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const now = new Date();
    const newProduct: Product = { 
      ...product, 
      id, 
      updatedAt: now
    };
    
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: InsertProduct): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    
    if (!existingProduct) {
      return undefined;
    }
    
    const now = new Date();
    const updatedProduct: Product = { 
      ...existingProduct, 
      ...product, 
      updatedAt: now
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
}

export const storage = new MemStorage();
