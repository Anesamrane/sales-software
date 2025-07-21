// app/dashboard/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface TopProduct {
  name: string;
  totalSold: number;
}

interface RevenueByUser {
  displayName: string;
  totalRevenue: number;
}

interface RevenueByDay {
  day: string;
  dailyRevenue: number;
}
type TicketSummary = {
  displayName: string;
  ticketCount: number;
};


export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<RevenueByDay[]>([]);
  const [revenueByUser, setRevenueByUser] = useState<RevenueByUser[]>([]);
  const [ticketData, setTicketData] = useState<TicketSummary[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/stats/total-revenue')
      .then(res => res.json())
      .then(data => setTotalRevenue(data.totalRevenue || 0));
      fetch('http://localhost:3001/api/sales/today-tickets-by-user')
      .then(res => res.json())
      .then(setTicketData);


    fetch('http://localhost:3001/api/stats/total-products-sold')
      .then(res => res.json())
      .then(data => setTotalSold(data.totalSold || 0));

    fetch('http://localhost:3001/api/stats/inventory-value')
      .then(res => res.json())
      .then(data => setInventoryValue(data.inventoryValue || 0));

    fetch('http://localhost:3001/api/stats/profit')
      .then(res => res.json())
      .then(data => setProfit(data.profit || 0));

    fetch('http://localhost:3001/api/stats/top-products')
      .then(res => res.json())
      .then(setTopProducts);

    fetch('http://localhost:3001/api/stats/revenue-daily')
      .then(res => res.json())
      .then(setDailyRevenue);

    fetch('http://localhost:3001/api/stats/revenue-by-user')
      .then(res => res.json())
      .then(setRevenueByUser);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">📊 Business Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Revenue" value={`DA ${totalRevenue.toFixed(2)}`} />
        <StatCard title="Profit" value={`DA ${profit.toFixed(2)}`} />
        <StatCard title="Products Sold" value={totalSold.toString()} />
        <StatCard title="Inventory Value" value={`DA ${inventoryValue.toFixed(2)}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Top 5 Selling Products">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Over Last 7 Days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyRevenue}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="dailyRevenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Cashier">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueByUser}
                dataKey="totalRevenue"
                nameKey="displayName"
                outerRadius={100}
                label
              >
                {revenueByUser.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tickets by Cashier">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={ticketData}
        dataKey="ticketCount"
        nameKey="displayName"
        outerRadius={100}
        label
      >
        {ticketData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
</ChartCard>

      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <p className="text-xl font-bold text-black">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded shadow h-80">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a1cfff'];