import React from 'react';
import { CourseDefinition } from '../types';
import { formatCurrency } from './MonthCard';

interface ReferenceTable2026Props {
  courses: CourseDefinition[];
  isPrivacyMode: boolean;
  onUpdateValue: (courseName: string, newValue: number) => void;
}

export const ReferenceTable2026: React.FC<ReferenceTable2026Props> = ({ courses, isPrivacyMode, onUpdateValue }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
      <div className="p-4 bg-slate-700/50 border-b border-slate-700">
        <h2 className="text-xl font-bold text-slate-100">Valor 2026 - Tabela de Referência</h2>
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
            {courses.sort((a, b) => a.name.localeCompare(b.name)).map(course => {
              const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const rawValue = e.target.value;
                // Extract only digits from the input
                const digits = rawValue.replace(/\D/g, '');
                // Convert the digits string to a number, treating the last two as cents
                const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
                onUpdateValue(course.name, numericValue);
              };

              return (
                <tr key={course.name} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">
                    {course.name}
                  </td>
                  
                  {isPrivacyMode ? (
                    <td className="px-6 py-4 text-left">R$ ••••••</td>
                  ) : (
                    <td className="p-0"> {/* Remove padding from the cell to allow input to fill it */}
                      <input
                        type="text"
                        value={formatCurrency(course.value)}
                        onChange={handleValueChange}
                        className="w-full text-left bg-transparent border-0 rounded-none py-4 px-6 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-slate-700"
                        aria-label={`Valor para ${course.name}`}
                      />
                    </td>
                  )}

                  <td className="px-6 py-4 text-center">
                    {course.hours}
                  </td>
                  <td className="px-6 py-4 text-left">
                    {isPrivacyMode ? 'R$ ••••••' : formatCurrency(course.value / course.hours)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};