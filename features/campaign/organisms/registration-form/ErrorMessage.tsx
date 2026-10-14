import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  id?: string;
  message?: string;
}

export const ErrorMessage = ({ id, message }: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <div id={id} role="alert" className="flex items-center gap-2 text-rose-600 text-sm font-medium px-1">
      <AlertCircle size={14} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};
