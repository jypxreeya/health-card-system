import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, Download, List, Eye, Edit, 
  CreditCard, MessageSquare, MoreVertical, X, ChevronDown, ChevronUp
} from 'lucide-react';

const examplePatients = [
  {
    name: 'Ravi Kumar', age: 34, gender: 'Male', phone: '9876543210', card_number: 'HC10234',
    plan: 'Premium', status: 'Active', registration_date: '12 Apr 2026', last_visit: '24 Apr 2026',
    renewal_date: '12 Apr 2027', card_status: 'Issued', usage: 'Frequent Visitor'
  },
  {
    name: 'Priya S', age: 29, gender: 'Female', phone: '9123456780', card_number: 'HC10235',
    plan: 'Family', status: 'Pending Renewal', registration_date: '03 Jan 2026', last_visit: '10 Mar 2026',
    renewal_date: '03 Jan 2027', card_status: 'Issued', usage: 'Used This Month'
  },
  {
    name: 'Kumar V', age: 63, gender: 'Male', phone: '9988776655', card_number: 'HC10236',
    plan: 'Premium', status: 'Expired', registration_date: '14 Feb 2025', last_visit: '20 Dec 2025',
    renewal_date: '14 Feb 2026', card_status: 'Not Sent', usage: 'Inactive 90 Days'
  }
];

const FilterSection = ({ title, options, isExpanded, onToggle, selectedValues, onChange }) => (
  <div style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 0' }}>
    <div 
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      onClick={onToggle}
    >
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>{title}</h4>
      {isExpanded ? <ChevronUp size={16} color="#A0AEC0" /> : <ChevronDown size={16} color="#A0AEC0" />}
    </div>
    {isExpanded && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        {options.map((opt, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={selectedValues.includes(opt)}
              onChange={() => onChange(opt)}
              style={{ accentColor: '#E8528A', width: '16px', height: '16px' }} 
            />
            <span style={{ fontSize: '13px', color: '#4A5568', fontWeight: 500 }}>{opt}</span>
          </label>
        ))}
      </div>
    )}
  </div>
);

const PatientPortal = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter expansion state
  const [expandedFilters, setExpandedFilters] = useState({
    plan: true, status: true, gender: false, age: false, card: false, usage: false,
    regDate: false, visitDate: false, renDate: false
  });

  const toggleExpanded = (key) => setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));

  // Selected filters in the sidebar (before applying)
  const [selectedFilters, setSelectedFilters] = useState({
    plan: [], status: [], gender: [], age: [], card: [], usage: [], regDate: [], visitDate: [], renDate: []
  });

  // Filters that are actually applied to the table
  const [appliedFilters, setAppliedFilters] = useState({
    plan: [], status: [], gender: [], age: [], card: [], usage: [], regDate: [], visitDate: [], renDate: []
  });

  const handleFilterChange = (category, value) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      return {
        ...prev,
        [category]: current.includes(value) ? current.filter(v => v !== value) : [...current, value]
      };
    });
  };

  const clearFilters = () => {
    const emptyFilters = { plan: [], status: [], gender: [], age: [], card: [], usage: [], regDate: [], visitDate: [], renDate: [] };
    setSelectedFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const applyFilters = () => {
    setAppliedFilters(selectedFilters);
    // Optionally close the sidebar after applying
    // setIsFilterOpen(false); 
  };

  const filteredPatients = useMemo(() => {
    return examplePatients.filter(p => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !p.name.toLowerCase().includes(query) &&
          !p.phone.toLowerCase().includes(query) &&
          !p.card_number.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 2. Membership Plan
      if (appliedFilters.plan.length > 0) {
        // Map 'Premium Health Card' -> 'Premium', 'Family Health Card' -> 'Family'
        const mappedPlans = appliedFilters.plan.map(pl => pl.replace(' Health Card', ''));
        if (!mappedPlans.includes(p.plan)) return false;
      }

      // 3. Membership Status
      if (appliedFilters.status.length > 0 && !appliedFilters.status.includes(p.status)) {
        return false;
      }

      // 4. Gender
      if (appliedFilters.gender.length > 0 && !appliedFilters.gender.includes(p.gender)) {
        return false;
      }

      // 5. Age Group
      if (appliedFilters.age.length > 0) {
        const ageGroup = p.age < 18 ? 'Child' : p.age < 60 ? 'Adult' : 'Senior Citizen';
        if (!appliedFilters.age.includes(ageGroup)) return false;
      }

      // 6. Card Status
      if (appliedFilters.card.length > 0) {
        // Map 'Card Issued' -> 'Issued', 'Card Not Sent' -> 'Not Sent'
        const mappedCardStatus = appliedFilters.card.map(c => c.replace('Card ', ''));
        if (!mappedCardStatus.includes(p.card_status)) return false;
      }

      // 7. Usage Filters
      if (appliedFilters.usage.length > 0 && !appliedFilters.usage.includes(p.usage)) {
        return false;
      }

      // Add logic for Dates (Registration, Last Visit, Renewal) if needed.
      // Dates usually require parsing ranges, skipping complex date logic for simple exact matches here if needed.

      return true;
    });
  }, [appliedFilters, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', height: '100%', overflow: 'hidden' }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A202C', letterSpacing: '-0.02em' }}>Patient Portal</h1>
          <p style={{ fontSize: '13px', color: '#718096', marginTop: '4px', fontWeight: 500 }}>
            Manage patient records, memberships, and recent activity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-pink-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
            <List size={16} /> Bulk Actions
          </button>
          <button className="btn-pink-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
            <Download size={16} /> Export Data
          </button>
          <button className="btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
            <Plus size={16} /> Add Patient
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#CBD5E0' }} />
          <input 
            type="text" 
            placeholder="Search by patient name, phone number, card number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '16px 20px 16px 48px', fontSize: '15px', fontFamily: 'Poppins, sans-serif',
              border: '2px solid #FFCCE0', borderRadius: '12px', outline: 'none', color: '#1A202C',
              boxShadow: '0 4px 12px rgba(232,82,138,0.05)', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#E8528A'}
            onBlur={e => e.target.style.borderColor = '#FFCCE0'}
          />
        </div>
        <button 
          className="btn-dark"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', borderRadius: '12px', height: '56px' }}
        >
          <Filter size={18} /> Filter By
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '24px', overflow: 'hidden' }}>
        
        {/* ── MAIN TABLE ── */}
        <div className="pink-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#FFF0F5', zIndex: 10 }}>
                <tr>
                  {['Patient Name', 'Age', 'Gender', 'Phone Number', 'Card Number', 'Membership Plan', 'Membership Status', 'Registration Date', 'Last Visit Date', 'Renewal Date', 'Card Status', 'Usage Status', 'Actions'].map((h, i) => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '2px solid #FFCCE0', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? filteredPatients.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #FFF0F5', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF8FB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px', fontWeight: 700, color: '#1A202C', fontSize: '13px', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '13px' }}>{p.age}</td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '13px' }}>{p.gender}</td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '13px' }}>{p.phone}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, backgroundColor: '#FFF0F5', padding: '4px 8px', borderRadius: '6px', border: '1px solid #FFCCE0' }}>
                        {p.card_number}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: '#E8528A', fontSize: '13px' }}>{p.plan}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                        backgroundColor: p.status === 'Active' ? '#F0FFF4' : p.status === 'Pending Renewal' ? '#FFFBEB' : '#FFF5F5',
                        color: p.status === 'Active' ? '#22863A' : p.status === 'Pending Renewal' ? '#D97706' : '#C53030',
                        border: `1px solid ${p.status === 'Active' ? '#C6F6D5' : p.status === 'Pending Renewal' ? '#FDE68A' : '#FEB2B2'}`
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.registration_date}</td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.last_visit}</td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.renewal_date}</td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: 500 }}>{p.card_status}</td>
                    <td style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: 500 }}>{p.usage}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer' }} title="View"><Eye size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#E8528A', cursor: 'pointer' }} title="Edit"><Edit size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#48BB78', cursor: 'pointer' }} title="Download Card"><CreditCard size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#667EEA', cursor: 'pointer' }} title="Message"><MessageSquare size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#A0AEC0', cursor: 'pointer' }} title="More"><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={13} style={{ padding: '60px', textAlign: 'center', color: '#A0AEC0', fontSize: '14px', fontWeight: 600 }}>
                      No patients found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FILTER SIDEBAR ── */}
        {isFilterOpen && (
          <div className="pink-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #FFCCE0', backgroundColor: '#FFF0F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A202C' }}>Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0' }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '0 20px', overflowY: 'auto', flex: 1 }}>
              <FilterSection title="Membership Plan" options={['Premium Health Card', 'Family Health Card']} selectedValues={selectedFilters.plan} onChange={(val) => handleFilterChange('plan', val)} isExpanded={expandedFilters.plan} onToggle={() => toggleExpanded('plan')} />
              <FilterSection title="Membership Status" options={['Active', 'Expired', 'Pending Renewal', 'Suspended']} selectedValues={selectedFilters.status} onChange={(val) => handleFilterChange('status', val)} isExpanded={expandedFilters.status} onToggle={() => toggleExpanded('status')} />
              <FilterSection title="Registration Date" options={['Today', 'This Week', 'This Month', 'Custom Date Range']} selectedValues={selectedFilters.regDate} onChange={(val) => handleFilterChange('regDate', val)} isExpanded={expandedFilters.regDate} onToggle={() => toggleExpanded('regDate')} />
              <FilterSection title="Last Visit Date" options={['Last 7 Days', 'Last 30 Days', 'Custom Range']} selectedValues={selectedFilters.visitDate} onChange={(val) => handleFilterChange('visitDate', val)} isExpanded={expandedFilters.visitDate} onToggle={() => toggleExpanded('visitDate')} />
              <FilterSection title="Renewal Date" options={['Expiring in 7 Days', 'Expiring in 30 Days', 'Overdue Renewal']} selectedValues={selectedFilters.renDate} onChange={(val) => handleFilterChange('renDate', val)} isExpanded={expandedFilters.renDate} onToggle={() => toggleExpanded('renDate')} />
              <FilterSection title="Gender" options={['Male', 'Female', 'Other']} selectedValues={selectedFilters.gender} onChange={(val) => handleFilterChange('gender', val)} isExpanded={expandedFilters.gender} onToggle={() => toggleExpanded('gender')} />
              <FilterSection title="Age Group" options={['Child', 'Adult', 'Senior Citizen']} selectedValues={selectedFilters.age} onChange={(val) => handleFilterChange('age', val)} isExpanded={expandedFilters.age} onToggle={() => toggleExpanded('age')} />
              <FilterSection title="Card Status" options={['Card Issued', 'Card Not Sent']} selectedValues={selectedFilters.card} onChange={(val) => handleFilterChange('card', val)} isExpanded={expandedFilters.card} onToggle={() => toggleExpanded('card')} />
              <FilterSection title="Usage Filters" options={['Never Used Card', 'Frequent Visitor', 'Used This Month', 'Inactive 90 Days']} selectedValues={selectedFilters.usage} onChange={(val) => handleFilterChange('usage', val)} isExpanded={expandedFilters.usage} onToggle={() => toggleExpanded('usage')} />
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
              <button className="btn-pink-outline" onClick={clearFilters} style={{ flex: 1, padding: '10px' }}>Clear All</button>
              <button className="btn-dark" onClick={applyFilters} style={{ flex: 1, padding: '10px' }}>Apply Filters</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PatientPortal;
