import React from 'react';
import { AliquotaEntry, FeeEntry } from '../types';

interface AliquotaTable2027Props {
  aliquotaData: AliquotaEntry[];
  feesData: FeeEntry[];
  onUpdateAliquota: (month: string, value: string) => void;
  onUpdateFee: (label: string, value: string) => void;
}

const formatCurrencyFromDigits = (digits: string): string => {
  if (!digits) return 'R$ 0,00';
  const numericValue = parseInt(digits, 10) / 100;
  if (isNaN(numericValue)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

export const AliquotaTable2027: React.FC<AliquotaTable2027Props> = ({ aliquotaData, feesData, onUpdateAliquota, onUpdateFee }) => {
  const inputClasses = "w-full text-right bg-transparent border-0 rounded-none py-1 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-slate-700";

  const handleAliquotaChange = (e: React.ChangeEvent<HTMLInputElement>, month: string) => {
    const value = e.target.value.replace('%', '');
    // Allow only numbers and one comma
    const sanitizedValue = value.replace(/[^0-9,]/g, '').replace(/,(?=.*,)/g, '');
    onUpdateAliquota(month, sanitizedValue);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const digits = e.target.value.replace(/\D/g, '');
    onUpdateFee(label, digits);
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
      <div className="p-4 bg-slate-700/50 border-b border-slate-700">
        <h2 className="text-xl font-bold text-slate-100">Alíquota Simples 2027</h2>
      </div>
      <div className="p-4 space-y-3">
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
          <table className="w-full text-sm text-left text-slate-300">
            <tbody>
              {aliquotaData.map(item => (
                <tr key={item.month} className="border-b border-slate-700 last:border-b-0">
                  <td className="px-4 py-1 font-medium text-slate-100 bg-slate-700/50 w-1/3">
                    {item.month}
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={item.value ? `${item.value}%` : ''}
                      onChange={(e) => handleAliquotaChange(e, item.month)}
                      className={inputClasses}
                      placeholder="0,00%"
                      aria-label={`Alíquota para ${item.month}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
          <table className="w-full text-sm text-left text-slate-300">
             <tbody>
              {feesData.map(item => (
                <tr key={item.label} className="border-b border-slate-700 last:border-b-0">
                  <td className="px-4 py-1 font-medium text-slate-100 bg-slate-700/50 w-1/2">
                    {item.label}
                  </td>
                  <td className="p-0">
                     <input
                      type="text"
                      value={formatCurrencyFromDigits(item.value)}
                      onChange={(e) => handleFeeChange(e, item.label)}
                      className={inputClasses}
                      aria-label={`Valor para ${item.label}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
