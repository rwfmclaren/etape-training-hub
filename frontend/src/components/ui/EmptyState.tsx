import { ReactNode } from 'react';
import { HiOutlineInboxIn } from 'react-icons/hi';

interface EmptyStateProps {
  icon?: any;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon = HiOutlineInboxIn, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}
