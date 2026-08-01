import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h3 className="mt-2 text-3xl font-bold">
            {value}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl bg-red-100 p-3 text-red-700">
          {icon}
        </div>
      </div>
    </div>
  );
}