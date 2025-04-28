import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type DeleteConfirmationProps = {
  itemId: number;
  itemName: string;
  itemType: "client" | "product";
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteConfirmation({
  itemId,
  itemName,
  itemType,
  onClose,
  onDeleted,
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteItem = useMutation({
    mutationFn: async () => {
      const endpoint = itemType === "client" ? `/api/clients/${itemId}` : `/api/products/${itemId}`;
      return await apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      // Invalidar todos os caches relacionados a produtos para forçar recarregamento
      if (itemType === "product") {
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      }
      onDeleted();
    },
    onError: (error) => {
      console.error(`Error deleting ${itemType}:`, error);
      setIsDeleting(false);
    },
  });

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    deleteItem.mutate();
  };

  const itemTypeLabel = itemType === "client" ? "cliente" : "produto";

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {itemType === "client" ? "o cliente" : "o produto"} <strong>{itemName}</strong>? Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirmDelete();
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
