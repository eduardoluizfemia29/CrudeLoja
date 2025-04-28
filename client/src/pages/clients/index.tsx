import { useState } from "react";
import { useSearch } from "@/hooks/use-search";
import { Client } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { formatPhone, formatDate } from "@/lib/utils/format";
import ClientForm from "./client-form";
import DeleteConfirmation from "./delete-confirmation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const { data: clients, isLoading, refreshData } = useSearch<Client>({
    queryKey: '/api/clients',
    searchQuery,
    debounceMs: 300
  });

  const handleAddClient = () => {
    setSelectedClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteConfirm(true);
  };

  const handleClientSaved = () => {
    setShowForm(false);
    refreshData();
    toast({
      title: "Cliente salvo",
      description: "Cliente salvo com sucesso!"
    });
  };

  const handleClientDeleted = () => {
    setShowDeleteConfirm(false);
    refreshData();
    toast({
      title: "Cliente excluído",
      description: "Cliente excluído com sucesso!"
    });
  };

  const columns = [
    {
      header: "Nome",
      accessor: "name",
      cell: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      header: "Contato",
      accessor: (row: Client) => (
        <div>
          {formatPhone(row.phone)}<br/>
          {row.email}
        </div>
      ),
    },
    {
      header: "Endereço",
      accessor: (row: Client) => (
        <div>
          {row.address}<br/>
          {row.city} - {row.state}
        </div>
      ),
    },
    {
      header: "Último Pedido",
      accessor: "lastOrderDate",
      cell: (value: string) => formatDate(value),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        
        <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
          <div className="relative rounded-md shadow-sm flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <Button onClick={handleAddClient}>
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Novo Cliente
          </Button>
        </div>
      </div>
      
      <div className="mt-4">
        <DataTable
          data={clients}
          columns={columns}
          keyExtractor={(row) => row.id}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          rowsPerPage={10}
          currentPage={1}
          totalItems={clients.length}
        />
      </div>

      {/* Client Form Dialog */}
      {showForm && (
        <ClientForm
          client={selectedClient}
          onClose={() => setShowForm(false)}
          onSaved={handleClientSaved}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedClient && (
        <DeleteConfirmation
          itemId={selectedClient.id}
          itemName={selectedClient.name}
          itemType="client"
          onClose={() => setShowDeleteConfirm(false)}
          onDeleted={handleClientDeleted}
        />
      )}
    </div>
  );
}
