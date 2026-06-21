import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete', 
  isDanger = true 
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${isDanger ? 'bg-[var(--color-error-container)] text-[var(--color-error)]' : 'bg-[var(--color-primary-container)] text-[var(--color-primary)]'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 mt-1 text-[var(--color-on-surface-variant)] text-sm leading-relaxed font-medium">
            {message}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-[var(--color-surface-container-high)]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant={isDanger ? 'danger' : 'primary'} 
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
