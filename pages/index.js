import React from 'react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Uber Clone</h1>
      <p className="mb-4">Welcome to the Uber Clone application.</p>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Backend Services</h2>
        <ul className="list-disc pl-5">
          <li>Authentication API</li>
          <li>Ride Management</li>
          <li>Driver Services</li>
          <li>Payment Processing</li>
        </ul>
      </div>
    </div>
  );
}