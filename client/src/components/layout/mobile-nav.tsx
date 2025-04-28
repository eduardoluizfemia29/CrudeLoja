import { useLocation, Link } from "wouter";
import { Menu } from "lucide-react";

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
      <div className="bg-white py-3 px-4 shadow md:hidden flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">SG Loja</h1>
        <button 
          onClick={toggleMenu}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden bg-white absolute inset-x-0 top-14 z-50 shadow-lg ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') ? 'text-primary bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Dashboard
            </a>
          </Link>
          <Link href="/clients">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/clients') ? 'text-primary bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Clientes
            </a>
          </Link>
          <Link href="/products">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/products') ? 'text-primary bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Produtos
            </a>
          </Link>
          <Link href="/reports">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/reports') ? 'text-primary bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Relatórios
            </a>
          </Link>
        </div>
      </div>
    </>
  );
}
