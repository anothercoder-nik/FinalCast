import React from 'react';

const StudioFilters = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="backdrop-blur-md bg-white/15 border border-white/30 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-white mb-2">
            Search Studios
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by title or description..."
            className="w-full px-4 py-3 backdrop-blur-md bg-white/15 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all placeholder-white/60 shadow-lg"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-4 py-3 backdrop-blur-md bg-white/15 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all shadow-lg"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">
            Your Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
          >
            <option value="all">All Roles</option>
            <option value="host">Host</option>
            <option value="participant">Participant</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default StudioFilters;
