import { useLocation, Link } from "wouter";
import { Menu, UtensilsCrossed, ShoppingBasket, HomeIcon, Users, BarChart3, ShoppingCart } from "lucide-react";

type MobileNavProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="bg-primary/10 py-3 px-4 shadow md:hidden flex items-center justify-between">
        <div className="flex items-center">
          <UtensilsCrossed className="h-6 w-6 text-primary mr-2" />
          <div>
            <h1 className="text-xl font-bold text-primary">duarDo</h1>
            <p className="text-xs text-gray-600">Sistema de Gerenciamento</p>
          </div>
        </div>
        <button 
          onClick={toggleMenu}
          className="text-primary hover:text-primary/80 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden bg-white absolute inset-x-0 top-[69px] z-50 shadow-lg ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/">
            <a className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') ? 'text-primary bg-primary/10' : 'text-gray-700 hover:bg-accent/20'
            }`}>
              <HomeIcon className="w-5 h-5 mr-3" />
              Dashboard
            </a>
          </Link>
          <Link href="/clients">
            <a className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
              isActive('/clients') ? 'text-primary bg-primary/10' : 'text-gray-700 hover:bg-accent/20'
            }`}>
              <Users className="w-5 h-5 mr-3" />
              Clientes
            </a>
          </Link>
          <Link href="/products">
            <a className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
              isActive('/products') ? 'text-primary bg-primary/10' : 'text-gray-700 hover:bg-accent/20'
            }`}>
              <ShoppingBasket className="w-5 h-5 mr-3" />
              Produtos
            </a>
          </Link>
          <Link href="/sales">
            <a className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
              isActive('/sales') ? 'text-primary bg-primary/10' : 'text-gray-700 hover:bg-accent/20'
            }`}>
              <ShoppingCart className="w-5 h-5 mr-3" />
              Vendas
            </a>
          </Link>
          <Link href="/reports">
            <a className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
              isActive('/reports') ? 'text-primary bg-primary/10' : 'text-gray-700 hover:bg-accent/20'
            }`}>
              <BarChart3 className="w-5 h-5 mr-3" />
              Relatórios
            </a>
          </Link>
        </div>
      </div>
    </>
  );
}
