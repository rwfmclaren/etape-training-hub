import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
        hover ? 'transition-shadow duration-200 hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, color = 'blue' }: {
  title: string;
  value: string | number;
  icon?: any;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && (
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
}
