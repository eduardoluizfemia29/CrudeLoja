import { useLocation, Link } from "wouter";
import { 
  HomeIcon, 
  Users, 
  Package, 
  BarChart3, 
  LogOut,
  UtensilsCrossed,
  ShoppingBasket,
  Droplets,
  ShoppingCart
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { name: "Dashboard", icon: HomeIcon, path: "/" },
    { name: "Clientes", icon: Users, path: "/clients" },
    { name: "Produtos", icon: ShoppingBasket, path: "/products" },
    { name: "Vendas", icon: ShoppingCart, path: "/sales" },
    { name: "Relatórios", icon: BarChart3, path: "/reports" }
  ];

  return (
    <aside className="bg-white border-r border-gray-200 w-full md:w-64 md:min-h-screen md:flex md:flex-col md:fixed md:inset-y-0 hidden md:block">
      <div className="p-4 border-b border-gray-200 bg-primary/10">
        <div className="flex items-center">
          <UtensilsCrossed className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold text-primary font-barriecito">duarDo</h1>
        </div>
        <p className="text-xs text-gray-600 mt-1">Sistema de Gerenciamento</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md group
              ${isActive(item.path) 
                ? "bg-primary/10 text-primary" 
                : "text-gray-700 hover:bg-accent/20"}`}
            >
              <item.icon 
                className={`w-5 h-5 mr-3 ${isActive(item.path) ? "text-primary" : "text-gray-500"}`} 
              />
              {item.name}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
          <LogOut className="w-5 h-5 mr-3 text-gray-500" />
          Sair
        </button>
      </div>
    </aside>
  );
}
