
import React, { useMemo } from 'react';
import { CourseEntry, Status, CourseDefinition } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { TrashIcon } from './icons/TrashIcon';
import { GripVerticalIcon } from './icons/GripVerticalIcon';

const formatCurrency = (value: number): string => {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Color mapping for the status "pill" based on the user's image
const statusPillColorMap: Record<Status, string> = {
    [Status.Realizado]: 'bg-blue-900/50 text-blue-300',
    [Status.Fechamento]: 'bg-red-900/50 text-red-300',
    [Status.Aprovado]: 'bg-green-900/50 text-green-300',
    [Status.Analise]: 'bg-orange-900/50 text-orange-300',
    [Status.Execucao]: 'bg-purple-900/50 text-purple-300',
    [Status.Cancelado]: 'bg-slate-600 text-slate-100 font-medium tracking-wide',
    [Status.Agendado]: 'bg-slate-700 text-slate-300',
    [Status.Recusado]: 'bg-red-800/70 text-red-200 font-bold uppercase',
    [Status.Confirmar]: 'bg-yellow-900/50 text-yellow-300',
};

// Color mapping for the row's left border
const rowBorderColorMap: Record<Status, string> = {
    [Status.Realizado]: 'border-blue-500',
    [Status.Fechamento]: 'border-red-500',
    [Status.Aprovado]: 'border-green-400',
    [Status.Analise]: 'border-orange-400',
    [Status.Execucao]: 'border-purple-500',
    [Status.Cancelado]: 'border-slate-500',
    [Status.Agendado]: 'border-slate-600',
    [Status.Recusado]: 'border-red-500',
    [Status.Confirmar]: 'border-yellow-400',
};

// Color mapping for the row's subtle background tint
const rowBgColorMap: Record<Status, string> = {
  [Status.Realizado]: 'bg-blue-900/10',
  [Status.Fechamento]: 'bg-red-900/10',
  [Status.Aprovado]: 'bg-green-900/10',
  [Status.Analise]: 'bg-orange-900/10',
  [Status.Execucao]: 'bg-purple-900/10',
  [Status.Cancelado]: 'bg-slate-800/30', // Slightly darker to indicate cancellation
  [Status.Agendado]: 'bg-slate-700/20', // Slightly different from default bg-slate-800
  [Status.Recusado]: 'bg-red-900/20',
  [Status.Confirmar]: 'bg-yellow-900/10',
};


interface CourseRowProps {
  course: CourseEntry;
  allLocations: string[];
  availableCourses: CourseDefinition[];
  referenceCourses: CourseDefinition[];
  isPrivacyMode: boolean;
  onUpdate: (updatedCourse: Partial<CourseEntry>) => void;
  onDelete: () => void;
  isBeingDragged: boolean;
  onDragStart: (course: CourseEntry) => void;
  onDrop: (targetCourseId: string) => void;
  onDragEnd: () => void;
}

export const CourseRow: React.FC<CourseRowProps> = ({ 
  course, 
  allLocations, 
  availableCourses, 
  referenceCourses, 
  isPrivacyMode, 
  onUpdate, 
  onDelete,
  isBeingDragged,
  onDragStart,
  onDrop,
  onDragEnd,
 }) => {
  const courseData = useMemo(() => {
    return referenceCourses.find(c => c.name === course.courseName);
  }, [course.courseName, referenceCourses]);

  const courseValue = useMemo(() => course.overriddenValue ?? courseData?.value ?? 0, [course.overriddenValue, courseData]);
  // Removed: const courseHours = useMemo(() => course.overriddenHours ?? courseData?.hours, [course.overriddenHours, courseData]);

  const sortedCourses = useMemo(() => 
    [...availableCourses].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  , [availableCourses]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourseName = e.target.value;
    onUpdate({ courseName: newCourseName });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Status;
    onUpdate({ status: newStatus });
  };

  // Removed handleHoursChange
  /*
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onUpdate({ overriddenHours: undefined });
      return;
    }
    const numericValue = parseInt(value.replace(/\D/g, ''), 10);
    if (!isNaN(numericValue)) {
      onUpdate({ overriddenHours: numericValue });
    }
  };
  */

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
    onUpdate({ overriddenValue: numericValue });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'date') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      let formatted = digits;

      if (digits.length > 6) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)} à ${digits.slice(4, 6)}/${digits.slice(6)}`;
      } else if (digits.length > 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)} à ${digits.slice(4)}`;
      } else if (digits.length > 2) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      }
      
      onUpdate({ [name]: formatted });
    } else if (name === 'location') {
        const userInput = value;

        // Don't autocomplete when deleting text
        if (course.location && userInput.length < course.location.length) {
            onUpdate({ location: userInput });
            return;
        }

        const suggestion = allLocations.find(loc =>
            loc.toLowerCase().startsWith(userInput.toLowerCase()) && userInput.length > 0 && loc.length > userInput.length
        );

        if (suggestion) {
            // Update state with the full suggestion
            onUpdate({ location: suggestion });

            // Use a microtask to set the selection range after the DOM updates
            setTimeout(() => {
                const inputElement = e.target;
                if (inputElement) {
                    inputElement.setSelectionRange(userInput.length, suggestion.length);
                }
            }, 0);
        } else {
            // No suggestion, just update with user input
            onUpdate({ location: userInput });
        }
    } else {
      onUpdate({ [name]: value });
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation(); // Prevent MonthCard's onDrop from firing
    onDrop(course.id);
  };
  
  const rowClasses = `
    ${rowBgColorMap[course.status] || 'bg-slate-800'} hover:bg-slate-700/50 border-b border-slate-700
    transition-colors
    ${course.status === Status.Cancelado || course.status === Status.Recusado ? 'opacity-60' : ''}
    ${course.status === Status.Cancelado ? 'line-through' : ''}
    ${isBeingDragged ? 'opacity-30' : ''}
  `;

  const statusSelectClasses = `
    w-full font-semibold text-center text-xs sm:text-sm appearance-none cursor-pointer
    rounded-full py-1.5 px-3 border-2 border-transparent 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500
    ${statusPillColorMap[course.status] || ''}
  `;

  const inputClasses = `
    w-full bg-transparent p-1 -m-1 rounded-md border border-transparent 
    hover:border-slate-600 focus:outline-none focus:ring-2 
    focus:ring-green-500 focus:border-transparent focus:bg-slate-700
    placeholder:text-slate-500
  `;
  
  const selectClasses = `${inputClasses} appearance-none`;
  
  return (
    <tr 
      className={rowClasses}
      draggable={true}
      onDragStart={() => onDragStart(course)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
    >
      <td className={`pl-1 pr-2 py-2 text-center cursor-grab border-l-4 ${rowBorderColorMap[course.status]}`}>
        <div className="flex justify-center">
          <GripVerticalIcon />
        </div>
      </td>
      <td className={`px-4 py-2`}>
        <input
          type="text"
          name="date"
          value={course.date}
          onChange={handleInputChange}
          className={inputClasses}
          placeholder="dd/mm à dd/mm"
          maxLength={16}
        />
      </td>
      <td className={`px-4 py-2`}>
        <input
          type="text"
          name="location"
          value={course.location}
          onChange={handleInputChange}
          className={inputClasses}
          placeholder="Cidade"
        />
      </td>
      <td className={`px-4 py-2`}>
        <select
          value={course.courseName}
          onChange={handleCourseChange}
          className={selectClasses}
        >
          <option value="">Selecione um curso</option>
          {sortedCourses.map(c => (
            <option key={c.name} value={c.name} className="bg-slate-800 text-slate-200">{c.name}</option>
          ))}
        </select>
      </td>
      {/* Removed: Hours Column
      <td className={`px-4 py-2 text-center`}>
          <input
            type="text"
            value={courseHours ?? ''}
            onChange={handleHoursChange}
            className={`${inputClasses} text-center`}
            placeholder="-"
            aria-label={`Horas para ${course.courseName}`}
          />
      </td>
      */}
      <td className={`px-4 py-2 text-center`}>
        {isPrivacyMode ? (
          'R$ ••••••'
        ) : (
          <input
            type="text"
            value={formatCurrency(courseValue)}
            onChange={handleValueChange}
            className={`${inputClasses} text-right`}
            aria-label={`Valor para ${course.courseName}`}
          />
        )}
      </td>
      <td className={`px-4 py-2 text-center`}>
        <div className="relative">
          <select
            value={course.status}
            onChange={handleStatusChange}
            className={statusSelectClasses}
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status} className="bg-slate-800 text-slate-200">{status}</option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-4 py-2 text-center border-l border-slate-700">
        <button
          onClick={onDelete}
          className={`p-1.5 rounded-full transition-colors text-slate-500 hover:text-red-400 hover:bg-red-900/30`}
          aria-label="Deletar curso"
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
};