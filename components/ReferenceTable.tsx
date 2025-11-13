import React from 'react';
import { COURSES_DATA } from '../constants';
import { formatCurrency } from './MonthCard';

interface ReferenceTableProps {
  isPrivacyMode: boolean;
}

export const ReferenceTable: React.FC<ReferenceTableProps> = ({ isPrivacyMode }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
      <div className="p-4 bg-slate-700/50 border-b border-slate-700">
        <h2 className="text-xl font-bold text-slate-100">Valor 2025 - Tabela de Referência</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-300 table-fixed">
          <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left w-5/12">Curso</th>
              <th scope="col" className="px-6 py-3 text-left w-3/12">Valor</th>
              <th scope="col" className="px-6 py-3 text-center w-2/12">Horas</th>
              <th scope="col" className="px-6 py-3 text-center w-2/12">Hora/Aula</th>
            </tr>
          </thead>
          <tbody>
            {COURSES_DATA.sort((a, b) => a.name.localeCompare(b.name)).map(course => (
              <tr key={course.name} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">
                  {course.name}
                </td>
                <td className="px-6 py-4 text-left">
                  {isPrivacyMode ? 'R$ ••••••' : formatCurrency(course.value)}
                </td>
                <td className="px-6 py-4 text-center">
                  {course.hours}
                </td>
                <td className="px-6 py-4 text-left">
                  {isPrivacyMode ? 'R$ ••••••' : formatCurrency(course.value / course.hours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};