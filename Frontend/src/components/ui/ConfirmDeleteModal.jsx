import Modal from "./Modal";
import Button from "./Button";
import { FiTrash2 } from "react-icons/fi";

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Product",
  message = "Are you sure you want to delete this product? This action cannot be undone.",
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <FiTrash2 size={22} />
        </div>

        <p className="text-sm text-gray-300">{message}</p>

        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white border-none"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
