import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Shield, User, Clock, Activity, Search } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogs = () => {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data;
    }
  });

  const logs = logsData?.data || [];

  const getActionColor = (action) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'text-green-600 bg-green-50';
    if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track staff actions and system changes for security compliance.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter actions..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(log.created_at), 'dd MMM yyyy')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{log.user_name || 'System'}</span>
                          <span className="text-xs text-gray-500 capitalize">{log.user_role?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {log.entity.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500 font-mono bg-gray-50 p-1.5 rounded">
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
