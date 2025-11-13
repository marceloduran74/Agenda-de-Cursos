
import React, { useState } from 'react';
import { MonthAgenda, CourseEntry, Status, CourseDefinition } from '../types';
import { CourseRow } from './CourseRow';
import { PlusIcon } from './icons/PlusIcon';

interface MonthCardProps {
  monthAgenda: MonthAgenda;
  allLocations: string[];
  availableCourses: CourseDefinition[];
  referenceCourses: CourseDefinition[];
  isPrivacyMode: boolean;
  onAddCourse: (monthId: string) => void;
  onUpdateCourse: (monthId: string, courseId: string, updatedCourse: Partial<CourseEntry>) => void;
  onDeleteCourse: (monthId: string, courseId: string) => void;
  draggedCourseInfo: { person: string; sourceMonthId: string; course: CourseEntry; } | null;
  onCourseDragStart: (monthId: string, course: CourseEntry) => void;
  onCourseDrop: (destinationMonthId: string, targetCourseId: string | null) => void;
  onCourseDragEnd: () => void;
}

export const formatCurrency = (value: number): string => {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const MonthCard: React.FC<MonthCardProps> = ({
  monthAgenda,
  allLocations,
  availableCourses,
  referenceCourses,
  isPrivacyMode,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  draggedCourseInfo,
  onCourseDragStart,
  onCourseDrop,
  onCourseDragEnd,
}) => {
  const [isBeingDraggedOver, setIsBeingDraggedOver] = useState(false);

  const monthlyTotal = monthAgenda.courses.reduce((acc, course) => {
    if ([Status.Cancelado, Status.Recusado].includes(course.status)) {
      return acc;
    }
    const courseData = referenceCourses.find(c => c.name === course.courseName);
    const courseValue = course.overriddenValue ?? courseData?.value ?? 0;
    return acc + courseValue;
  }, 0);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedCourseInfo) {
      setIsBeingDraggedOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsBeingDraggedOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBeingDraggedOver(false);
    onCourseDrop(monthAgenda.id, null); // Drop on card appends to the end
  };

  return (
    <div 
      className={`bg-slate-800 rounded-lg shadow-lg shadow-black/20 overflow-hidden transition-all duration-300 ${isBeingDraggedOver ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900' : 'hover:shadow-green-500/10'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-5 py-3 bg-slate-700/50 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-100">{monthAgenda.name}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
            <tr>
              <th scope="col" className="w-12 px-2"></th>
              <th scope="col" className="px-4 py-3 min-w-[150px]">Data</th>
              <th scope="col" className="px-4 py-3 min-w-[150px]">Localidade</th>
              <th scope="col" className="px-4 py-3 min-w-[180px]">Curso</th>
              <th scope="col" className="px-4 py-3 text-center">Horas</th>
              <th scope="col" className="px-4 py-3 text-center">Valor</th>
              <th scope="col" className="px-4 py-3 text-center min-w-[140px]">Status</th>
              <th scope="col" className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {monthAgenda.courses.length > 0 ? (
              monthAgenda.courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                allLocations={allLocations}
                availableCourses={availableCourses}
                referenceCourses={referenceCourses}
                isPrivacyMode={isPrivacyMode}
                onUpdate={(updatedCourse) => onUpdateCourse(monthAgenda.id, course.id, updatedCourse)}
                onDelete={() => onDeleteCourse(monthAgenda.id, course.id)}
                isBeingDragged={draggedCourseInfo?.course.id === course.id}
                onDragStart={(c) => onCourseDragStart(monthAgenda.id, c)}
                onDrop={(targetId) => onCourseDrop(monthAgenda.id, targetId)}
                onDragEnd={onCourseDragEnd}
              />
            ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-500">
                  Nenhum curso adicionado para este mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button
          onClick={() => onAddCourse(monthAgenda.id)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 font-medium rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
        >
          <PlusIcon />
          Adicionar Curso
        </button>
        <div className="flex items-baseline gap-3 font-semibold text-lg">
          <span className="text-slate-400">Total Mensal:</span>
          <span className="text-green-400 font-bold">{isPrivacyMode ? 'R$ ••••••' : formatCurrency(monthlyTotal)}</span>
        </div>
      </div>
    </div>
  );
};