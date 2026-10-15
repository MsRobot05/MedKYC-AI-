import { useState } from 'react';
import api from '../api/axios';
import { Pill, Search } from 'lucide-react';

export default function GenericFinder() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = async () => {
    const res = await api.get(`/medicine/search?query=${query}`);
    setResults(res.data);
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">Generic Medicine Finder</h1>
      <p className="text-sm text-gray-500 mb-6">Find affordable generic alternatives to branded medicines</p>

      <div className="flex gap-2 mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="e.g. Crocin"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
        <button onClick={search} style={{ backgroundColor: '#0B2942' }} className="text-white px-4 rounded-xl">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {results.map((m, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 mb-3" style={{ border: '1px solid #EAEBEF' }}>
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4" style={{ color: '#0F6E64' }} />
            <p className="font-medium text-sm text-gray-900">{m.brand} → {m.generic}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-400 line-through">₹{m.brandPrice}</span>
            <span className="font-semibold" style={{ color: '#0F6E64' }}>₹{m.genericPrice}</span>
            <span className="text-xs text-green-600 font-medium">
              Save {Math.round((1 - m.genericPrice / m.brandPrice) * 100)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}run 