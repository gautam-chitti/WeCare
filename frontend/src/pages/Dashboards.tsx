import React from 'react';
import { useAuth } from '../context/AuthContext';



export const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dr. {user?.name}</h1>
      <p>Doctor Dashboard</p>
      <p>Verification Status: {user?.verificationStatus}</p>
      <button onClick={logout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Logout</button>
    </div>
  );
};


