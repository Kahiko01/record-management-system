import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string; // e.g., "bg-blue-100"
  textColor: string; // e.g., "text-blue-600"
  border?: string; // Optional border highlight
}

export default function StatCard({ title, value, icon, bgColor, textColor, border }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${border || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold ${textColor} mt-1`}>{value}</p>
        </div>
        <div className={`p-3 ${bgColor} rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
