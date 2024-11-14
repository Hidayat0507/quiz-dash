"use client";

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, DollarSign, ShoppingCart } from 'lucide-react';
import { useUserData } from '@/hooks/use-user-data';

const defaultStats = [
  { title: 'Total Users', value: '0', icon: Users, change: '0%' },
  { title: 'Revenue', value: '$0', icon: DollarSign, change: '0%' },
  { title: 'Active Users', value: '0', icon: Activity, change: '0%' },
  { title: 'Sales', value: '0', icon: ShoppingCart, change: '0%' },
];

const defaultChartData = [
  { name: 'Jan', value: 0 },
  { name: 'Feb', value: 0 },
  { name: 'Mar', value: 0 },
  { name: 'Apr', value: 0 },
  { name: 'May', value: 0 },
  { name: 'Jun', value: 0 },
];

export default function Home() {
  const { stats, loading, error } = useUserData();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const displayStats = stats.length > 0 ? stats : defaultStats;

  // Transform quiz results into chart data
  const chartData = stats.length > 0 
    ? stats.map((stat, index) => ({
        name: stat.title,
        value: parseInt(stat.value) || 0
      }))
    : defaultChartData;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  <p className="text-sm text-green-500 mt-1">{stat.change}</p>
                </div>
                <Icon className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}