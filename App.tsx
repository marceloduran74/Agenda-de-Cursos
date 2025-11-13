
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MonthAgenda, CourseEntry, Status, CourseDefinition, AliquotaEntry, FeeEntry, FaturamentoMonthData } from './types';
import { INITIAL_AGENDAS, COURSES_DATA, MARCELO_COURSES_DATA, MARCIA_COURSES_DATA, INITIAL_ALIQUOTA_DATA, INITIAL_FEES_DATA, INITIAL_ALIQUOTA_DATA_2026, INITIAL_FEES_DATA_2026, INITIAL_FATURAMENTO_DATA, MONTH_NAMES, INITIAL_COURSES_DATA_2027, INITIAL_ALIQUOTA_DATA_2027, INITIAL_FEES_DATA_2027 } from './constants';
import { MonthCard } from './components/MonthCard';
import { ReferenceTable } from './components/ReferenceTable';
import { ReferenceTable2026 } from './components/ReferenceTable2026';
import { ReferenceTable2027 } from './components/ReferenceTable2027';
import { EyeIcon } from './components/icons/EyeIcon';
import { EyeOffIcon } from './components/icons/EyeOffIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { AliquotaTable } from './components/AliquotaTable';
import { AliquotaTable2026 } from './components/AliquotaTable2026';
import { AliquotaTable2027 } from './components/AliquotaTable2027';
import { CloudUploadIcon } from './components/icons/CloudUploadIcon';
import { FaturamentoView } from './components/FaturamentoTable'; 

type View = 'Marcelo' | 'Márcia' | 'Faturamento' | 'TabelaDeReferencia';

const APP_STATE_KEY = 'agendaSenarAppState';

// Helper function to load initial state from localStorage, applying migrations
const loadInitialState = () => {
  try {
    const savedStateJSON = localStorage.getItem(APP_STATE_KEY);
    if (savedStateJSON) {
      const savedState = JSON.parse(savedStateJSON);

      // --- Data Migration for course name changes ---
      const nameMapping: Record<string, string> = {
        'Inclusão': 'Inclusão Digital',
        'Excel': 'Excel Básico',
        'Informática': 'Informática Básica',
        'Tecelagem': 'Tecelagem com Lã Crua',
        'Confecção': 'Confecção com Lã Crua',
        'Bordado': 'Bordados a Mão',
        'Nota Fiscal': 'Nota Fiscal Avulsa',
      };

      // Migrate agendas
      if (savedState.agendas) {
        Object.values(savedState.agendas as Record<string, MonthAgenda[]>).forEach(personAgenda => {
          personAgenda.forEach(month => {
            month.courses.forEach(course => {
              if (nameMapping[course.courseName]) {
                course.courseName = nameMapping[course.courseName];
              }
            });
          });
        });
      }

      // Migrate 2026 course data
      if (savedState.courses2026Data) {
        (savedState.courses2026Data as CourseDefinition[]).forEach(course => {
          if (nameMapping[course.name]) {
            course.name = nameMapping[course.name];
          }
        });
      }
      // --- End Migration ---

      // --- Data Migration for Aliquota 2025 ---
      if (savedState.aliquotaData && Array.isArray(savedState.aliquotaData)) {
        // Fix: Corrected variable name from `hasJaneiroPróximo` to `hasJaneiroProximo`
        const hasJaneiroProximo = savedState.aliquotaData.some((entry: AliquotaEntry) => entry.month === 'Janeiro Próximo');
        if (!hasJaneiroProximo) {
          savedState.aliquotaData.push({ month: 'Janeiro Próximo', value: '' });
        }
      }
      // --- End Aliquota Migration ---
      
      // --- Data Migration for Fees 2026 Labels ---
      if (savedState.feesData2026 && Array.isArray(savedState.feesData2026)) {
        savedState.feesData2026 = savedState.feesData2026.map((fee: FeeEntry) => {
            if (fee.label === 'Honorários 2024') {
                return { ...fee, label: 'Honorários 2025' };
            }
            if (fee.label === 'Honorários 2025') {
                return { ...fee, label: 'Honorários 2026' };
            }
            if (fee.label === 'INSS 2025') {
                return { ...fee, label: 'INSS 2026' };
            }
            return fee;
        });
      }
      // --- End Fees 2026 Migration ---

      let loadedAgendaOrder: string[] = savedState.agendaOrder || ['Márcia', 'Marcelo']; // Fallback if no order saved

      // Ensure 'Faturamento' is in the agendaOrder and in the correct position
      if (!loadedAgendaOrder.includes('Faturamento')) {
        const marceloIndex = loadedAgendaOrder.indexOf('Marcelo');
        if (marceloIndex !== -1) {
          loadedAgendaOrder.splice(marceloIndex + 1, 0, 'Faturamento');
        } else {
          // Fallback if 'Marcelo' is not found, try inserting after 'Márcia' or at the end
          const marciaIndex = loadedAgendaOrder.indexOf('Márcia');
          if (marciaIndex !== -1) {
            loadedAgendaOrder.splice(marciaIndex + 1, 0, 'Faturamento');
          } else {
            loadedAgendaOrder.push('Faturamento'); // If neither, just push to the end
          }
        }
      } else {
        // If Faturamento is already present, ensure it's after Marcelo
        const currentMarceloIndex = loadedAgendaOrder.indexOf('Marcelo');
        const currentFaturamentoIndex = loadedAgendaOrder.indexOf('Faturamento');

        if (currentMarceloIndex !== -1 && currentFaturamentoIndex !== -1 && currentFaturamentoIndex < currentMarceloIndex) {
            // Faturamento is before Marcelo, move it after Marcelo
            const itemToMove = loadedAgendaOrder.splice(currentFaturamentoIndex, 1)[0];
            loadedAgendaOrder.splice(currentMarceloIndex + 1, 0, itemToMove);
        }
      }

      // Ensure unique elements and correct types (defensive)
      loadedAgendaOrder = Array.from(new Set(loadedAgendaOrder)).filter(item => typeof item === 'string');

      // Return combined saved state, falling back to initial constants for any missing fields
      return {
        agendas: savedState.agendas || INITIAL_AGENDAS,
        courses2026Data: savedState.courses2026Data || JSON.parse(JSON.stringify(COURSES_DATA)),
        aliquotaData: savedState.aliquotaData || INITIAL_ALIQUOTA_DATA,
        feesData: savedState.feesData || INITIAL_FEES_DATA,
        aliquotaData2026: savedState.aliquotaData2026 || INITIAL_ALIQUOTA_DATA_2026,
        feesData2026: savedState.feesData2026 || INITIAL_FEES_DATA_2026,
        courses2027Data: savedState.courses2027Data || INITIAL_COURSES_DATA_2027,
        aliquotaData2027: savedState.aliquotaData2027 || INITIAL_ALIQUOTA_DATA_2027,
        feesData2027: savedState.feesData2027 || INITIAL_FEES_DATA_2027,
        selectedReferenceYears: savedState.selectedReferenceYears || { 'Márcia': '2025', 'Marcelo': '2025' },
        agendaOrder: loadedAgendaOrder,
        faturamentoData: savedState.faturamentoData || INITIAL_FATURAMENTO_DATA, // Load Faturamento data
        activeReferenceTabYear: savedState.activeReferenceTabYear || '2025', // New: load active reference year
      };
    }
  } catch (error) {
    console.error("Failed to load state from localStorage", error);
  }
  // Fallback to initial constants if no saved state or error
  return {
    agendas: INITIAL_AGENDAS,
    courses2026Data: JSON.parse(JSON.stringify(COURSES_DATA)),
    aliquotaData: INITIAL_ALIQUOTA_DATA,
    feesData: INITIAL_FEES_DATA,
    aliquotaData2026: INITIAL_ALIQUOTA_DATA_2026,
    feesData2026: INITIAL_FEES_DATA_2026,
    courses2027Data: INITIAL_COURSES_DATA_2027,
    aliquotaData2027: INITIAL_ALIQUOTA_DATA_2027,
    feesData2027: INITIAL_FEES_DATA_2027,
    selectedReferenceYears: { 'Márcia': '2025', 'Marcelo': '2025' },
    agendaOrder: ['Márcia', 'Marcelo', 'Faturamento'], // Default order including new tab
    faturamentoData: INITIAL_FATURAMENTO_DATA, // Default Faturamento data
    activeReferenceTabYear: '2025', // Default active reference year
  };
};

const App: React.FC = () => {
  const initialState = loadInitialState();

  const [agendas, setAgendas] = useState<Record<string, MonthAgenda[]>>(initialState.agendas);
  const [activeView, setActiveView] = useState<View>('Márcia');
  const [courses2026Data, setCourses2026Data] = useState<CourseDefinition[]>(initialState.courses2026Data);
  const [aliquotaData, setAliquotaData] = useState<AliquotaEntry[]>(initialState.aliquotaData);
  const [feesData, setFeesData] = useState<FeeEntry[]>(initialState.feesData);
  const [aliquotaData2026, setAliquotaData2026] = useState<AliquotaEntry[]>(initialState.aliquotaData2026);
  const [feesData2026, setFeesData2026] = useState<FeeEntry[]>(initialState.feesData2026);
  const [courses2027Data, setCourses2027Data] = useState<CourseDefinition[]>(initialState.courses2027Data);
  const [aliquotaData2027, setAliquotaData2027] = useState<AliquotaEntry[]>(initialState.aliquotaData2027);
  const [feesData2027, setFeesData2027] = useState<FeeEntry[]>(initialState.feesData2027);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [selectedReferenceYears, setSelectedReferenceYears] = useState<Record<string, '2025' | '2026' | '2027'>>(initialState.selectedReferenceYears);
  const [agendaOrder, setAgendaOrder] = useState<string[]>(initialState.agendaOrder);
  const [draggedAgenda, setDraggedAgenda] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isInitialMount = useRef(true);
  const [faturamentoData, setFaturamentoData] = useState<FaturamentoMonthData[]>(initialState.faturamentoData);
  const [draggedCourseInfo, setDraggedCourseInfo, ] = useState<{ person: string; sourceMonthId: string; course: CourseEntry; } | null>(null);
  
  // New state for the reference year dropdown in the header
  const [activeReferenceTabYear, setActiveReferenceTabYear] = useState<'2025' | '2026' | '2027'>(initialState.activeReferenceTabYear);
  // Removed isReferenceDropdownOpen and dropdownRef

  // Removed useEffect for closing dropdown when clicking outside

  const recalculateFaturamentoChain = useCallback((dataToRecalculate: FaturamentoMonthData[]): FaturamentoMonthData[] => {
    const newData = JSON.parse(JSON.stringify(dataToRecalculate)); // Deep copy to avoid mutation issues

    for (let i = 0; i < newData.length; i++) {
        const currentMonth = newData[i];
        
        // Sync Faturamento field from personTotals for the current month.
        const lucianaFaturamento = currentMonth.personTotals.luciana.reduce((s, v) => s + v, 0);
        const marciaFaturamento = currentMonth.personTotals.marcia.reduce((s, v) => s + v, 0);
        const marceloFaturamento = currentMonth.personTotals.marcelo.reduce((s, v) => s + v, 0);
        const personFaturamentoMap = {
            'Luciana': lucianaFaturamento,
            'Márcia': marciaFaturamento,
            'Marcelo': marceloFaturamento,
        };

        let updatedEntries = currentMonth.entries.map(entry => {
            const newFaturamento = personFaturamentoMap[entry.person as keyof typeof personFaturamentoMap] ?? entry.faturamento;
            let newSimples = entry.simples; // Keep existing value by default (important for January)

            // For months from February onwards, calculate Simples based on the PREVIOUS month.
            // This logic relies on `aliquotaData` (2025) and assumes `faturamentoData` covers 13 months starting January 2025
            if (i > 0) {
                const prevMonth = newData[i - 1]; 
                const prevMonthAliquotaString = aliquotaData[i - 1]?.value || '0'; // Assuming 2025 aliquota data for now
                const prevMonthAliquota = parseFloat(prevMonthAliquotaString.replace(',', '.')) / 100;
                
                const prevMonthPersonEntry = prevMonth.entries.find(e => e.person === entry.person);
                if (prevMonthPersonEntry) {
                    newSimples = prevMonthPersonEntry.faturamento * prevMonthAliquota;
                }
            }

            // Now calculate derived values
            const newEntry = { ...entry, faturamento: newFaturamento, simples: newSimples };

            newEntry.valorTaxas = newEntry.honorarios + newEntry.inss + newEntry.simples;
            newEntry.valorLiquido = newEntry.faturamento - newEntry.valorTaxas;
            
            return newEntry;
        });

        // Recalculate month-level totals with the updated entries
        const newSimplesTotal = updatedEntries.reduce((sum, entry) => sum + entry.simples, 0);
        const newInssTotal = updatedEntries.reduce((sum, entry) => sum + entry.inss, 0);
        const newContadoraHonorarios = updatedEntries.reduce((sum, entry) => sum + entry.honorarios, 0);
        const newBruto = updatedEntries.reduce((sum, entry) => sum + entry.faturamento, 0);
        const newLiquido = updatedEntries.reduce((sum, entry) => sum + entry.valorLiquido, 0);
        
        newData[i] = {
            ...currentMonth,
            entries: updatedEntries,
            simplesTotal: newSimplesTotal,
            inssTotal: newInssTotal,
            contadoraHonorarios: newContadoraHonorarios,
            valorNota: newBruto,
            grossNet: { bruto: newBruto, liquido: newLiquido },
        };
    }
    return newData;
  }, [aliquotaData]);

  // Auto-save state to localStorage on change with debounce
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    setAutoSaveStatus('saving');
    const handler = setTimeout(() => {
      try {
        const appState = {
          agendas,
          courses2026Data,
          aliquotaData,
          feesData,
          aliquotaData2026,
          feesData2026,
          courses2027Data,
          aliquotaData2027,
          feesData2027,
          selectedReferenceYears,
          agendaOrder,
          faturamentoData, // Include Faturamento data in auto-save
          activeReferenceTabYear, // New: save active reference year
        };
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
        setAutoSaveStatus('saved');

        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error("Failed to auto-save state to localStorage", error);
        setAutoSaveStatus('idle');
      }
    }, 1500); // Debounce for 1.5 seconds

    return () => {
      clearTimeout(handler);
    };
  }, [agendas, courses2026Data, aliquotaData, feesData, aliquotaData2026, feesData2026, courses2027Data, aliquotaData2027, feesData2027, selectedReferenceYears, agendaOrder, faturamentoData, activeReferenceTabYear]);

  // Sync Faturamento "Totais Individuais" with Agendas and recalculate chain
  useEffect(() => {
    setFaturamentoData(prevData => {
        // Step 1: Sync `personTotals` from `agendas` for Márcia and Marcelo
        const syncedData = prevData.map((monthData, monthIndex) => {
            if (monthIndex >= agendas['Márcia'].length) return monthData;

            const marciaCourses = agendas['Márcia'][monthIndex]?.courses || [];
            const marceloCourses = agendas['Marcelo'][monthIndex]?.courses || [];

            const getReferenceData = (year: '2025' | '2026' | '2027') => {
              if (year === '2027') return courses2027Data;
              if (year === '2026') return courses2026Data;
              return COURSES_DATA;
            };

            const referenceDataMarcia = getReferenceData(selectedReferenceYears['Márcia']);
            const referenceDataMarcelo = getReferenceData(selectedReferenceYears['Marcelo']);

            const newMarciaTotals = marciaCourses.map(course => {
                if ([Status.Cancelado, Status.Recusado].includes(course.status)) return 0;
                const courseDef = referenceDataMarcia.find(c => c.name === course.courseName);
                return course.overriddenValue ?? courseDef?.value ?? 0;
            });
            
            const newMarceloTotals = marceloCourses.map(course => {
                if ([Status.Cancelado, Status.Recusado].includes(course.status)) return 0;
                const courseDef = referenceDataMarcelo.find(c => c.name === course.courseName);
                return course.overriddenValue ?? courseDef?.value ?? 0;
            });
            
            // Preserve existing Luciana totals
            const existingLucianaTotals = monthData.personTotals.luciana;

            // Synchronize array lengths
            const numRows = Math.max(existingLucianaTotals.length, newMarciaTotals.length, newMarceloTotals.length, 1);

            const finalLucianaTotals = Array.from({ length: numRows }, (_, i) => existingLucianaTotals[i] || 0);
            const finalMarciaTotals = Array.from({ length: numRows }, (_, i) => newMarciaTotals[i] || 0);
            const finalMarceloTotals = Array.from({ length: numRows }, (_, i) => newMarceloTotals[i] || 0);

            const newPersonTotals = {
                luciana: finalLucianaTotals,
                marcia: finalMarciaTotals,
                marcelo: finalMarceloTotals,
            };

            return { ...monthData, personTotals: newPersonTotals };
        });
        
        // Step 2: Run the full chained recalculation
        return recalculateFaturamentoChain(syncedData);
    });
  }, [agendas, courses2026Data, courses2027Data, selectedReferenceYears, recalculateFaturamentoChain]);

  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    Object.values(agendas).forEach((personAgenda: MonthAgenda[]) => {
      personAgenda.forEach(month => {
        month.courses.forEach(course => {
          if (course.location?.trim()) {
            locations.add(course.location.trim());
          }
        });
      });
    });
    return Array.from(locations);
  }, [agendas]);
  
  const handleAddCourse = useCallback((person: string, monthId: string) => {
    setAgendas(prev => ({
      ...prev,
      [person]: prev[person].map(month => {
        if (month.id === monthId) {
          const newCourse: CourseEntry = {
            id: `course-${crypto.randomUUID()}`,
            date: '',
            location: '',
            courseName: '',
            status: Status.Agendado,
          };
          return { ...month, courses: [...month.courses, newCourse] };
        }
        return month;
      })
    }));
  }, []);

  const handleUpdateCourse = useCallback(
    (person: string, monthId: string, courseId: string, updatedCourse: Partial<CourseEntry>) => {
      setAgendas(prev => ({
        ...prev,
        [person]: prev[person].map(month => {
          if (month.id === monthId) {
            return {
              ...month,
              courses: month.courses.map(course =>
                course.id === courseId ? { ...course, ...updatedCourse } : course
              ),
            };
          }
          return month;
        })
      }));
    },
    []
  );

  const handleDeleteCourse = useCallback((person: string, monthId: string, courseId: string) => {
    setAgendas(prev => ({
      ...prev,
      [person]: prev[person].map(month => {
        if (month.id === monthId) {
          return { ...month, courses: month.courses.filter(c => c.id !== courseId) };
        }
        return month;
      })
    }));
  }, []);

  const handleCourseDragStart = useCallback((person: string, sourceMonthId: string, course: CourseEntry) => {
    setDraggedCourseInfo({ person, sourceMonthId, course });
  }, []);

  const handleCourseDrop = useCallback((person: string, destinationMonthId: string, targetCourseId: string | null) => {
    if (!draggedCourseInfo || draggedCourseInfo.person !== person) {
      return;
    }

    const { sourceMonthId, course: draggedCourse } = draggedCourseInfo;
    
    setAgendas(prev => {
        const mutableAgendas = JSON.parse(JSON.stringify(prev));
        const personAgenda = mutableAgendas[person];

        const sourceMonth = personAgenda.find((m: MonthAgenda) => m.id === sourceMonthId);
        if (!sourceMonth) return prev;

        const courseIndexToRemove = sourceMonth.courses.findIndex((c: CourseEntry) => c.id === draggedCourse.id);
        if (courseIndexToRemove === -1) return prev;
        
        const [movedCourse] = sourceMonth.courses.splice(courseIndexToRemove, 1);

        const destinationMonth = personAgenda.find((m: MonthAgenda) => m.id === destinationMonthId);
        if (!destinationMonth) return prev;

        if (targetCourseId) {
            const targetIndex = destinationMonth.courses.findIndex((c: CourseEntry) => c.id === targetCourseId);
            if (targetIndex !== -1) {
                // Avoid dropping on itself
                if (sourceMonth.id === destinationMonth.id && courseIndexToRemove === targetIndex) {
                    return prev;
                }
                destinationMonth.courses.splice(targetIndex, 0, movedCourse);
            } else {
                destinationMonth.courses.push(movedCourse); // Fallback if target not found
            }
        } else {
            destinationMonth.courses.push(movedCourse); // Append to end if no target
        }

        return mutableAgendas;
    });
  }, [draggedCourseInfo]);

  const handleCourseDragEnd = useCallback(() => {
      setDraggedCourseInfo(null);
  }, []);
  
  const handleUpdate2026CourseValue = useCallback((courseName: string, newValue: number) => {
    setCourses2026Data(prev => 
      prev.map(course => 
        course.name === courseName ? { ...course, value: newValue } : course
      )
    );
  }, []);

  const handleUpdateAliquota = useCallback((month: string, newValue: string) => {
    setAliquotaData(prev => {
      const updatedData = prev.map(item => (item.month === month ? { ...item, value: newValue } : item));
      
      // If "Janeiro Próximo" (2025) is updated, copy its value to "Janeiro" (2026)
      if (month === 'Janeiro Próximo') {
        setAliquotaData2026(prev2026 => 
          prev2026.map(item2026 => 
            item2026.month === 'Janeiro' ? { ...item2026, value: newValue } : item2026
          )
        );
      }
      return updatedData;
    });
  }, []);

  const handleUpdateFee = useCallback((label: string, newValue: string) => {
    setFeesData(prev =>
      prev.map(item => (item.label === label ? { ...item, value: newValue } : item))
    );
  }, []);

  const handleUpdateAliquota2026 = useCallback((month: string, newValue: string) => {
    setAliquotaData2026(prev => {
      const updatedData = prev.map(item => (item.month === month ? { ...item, value: newValue } : item));
      
      // If "Janeiro Próximo" (2026) is updated, copy its value to "Janeiro" (2027)
      if (month === 'Janeiro Próximo') {
        setAliquotaData2027(prev2027 => 
          prev2027.map(item2027 => 
            item2027.month === 'Janeiro' ? { ...item2027, value: newValue } : item2027
          )
        );
      }
      return updatedData;
    });
  }, []);

  const handleUpdateFee2026 = useCallback((label: string, newValue: string) => {
    setFeesData2026(prev =>
      prev.map(item => (item.label === label ? { ...item, value: newValue } : item))
    );
  }, []);

  const handleUpdate2027CourseValue = useCallback((courseName: string, newValue: number) => {
    setCourses2027Data(prev => 
      prev.map(course => 
        course.name === courseName ? { ...course, value: newValue } : course
      )
    );
  }, []);

  const handleUpdateAliquota2027 = useCallback((month: string, newValue: string) => {
    setAliquotaData2027(prev =>
      prev.map(item => (item.month === month ? { ...item, value: newValue } : item))
    );
  }, []);

  const handleUpdateFee2027 = useCallback((label: string, newValue: string) => {
    setFeesData2027(prev =>
      prev.map(item => (item.label === label ? { ...item, value: newValue } : item))
    );
  }, []);
  
  const handleReferenceYearChange = useCallback((person: string, year: '2025' | '2026' | '2027') => {
    // Synchronize the selected year for both 'Márcia' and 'Marcelo'
    setSelectedReferenceYears(prev => ({ ...prev, 'Márcia': year, 'Marcelo': year }));
  }, []);

  const handleUpdateFaturamentoEntry = useCallback(
    (monthName: string, person: string, field: 'simples', newValue: number) => {
      setFaturamentoData(prevData => {
        // Step 1: Apply the direct user change for January's "Simples"
        const dataWithUserChange = prevData.map(month => {
          if (month.monthName === monthName) {
            const updatedEntries = month.entries.map(entry => {
              if (entry.person === person) {
                return { ...entry, [field]: newValue };
              }
              return entry;
            });
            return { ...month, entries: updatedEntries };
          }
          return month;
        });
        // Step 2: Recalculate the entire chain
        return recalculateFaturamentoChain(dataWithUserChange);
      });
    },
    [recalculateFaturamentoChain]
  );

  const handleUpdateIndividualTotal = useCallback(
    (monthName: string, rowIndex: number, newValue: number) => {
      setFaturamentoData(prevData => {
        // Step 1: Apply the direct user change for Luciana's totals
        const dataWithUserChange = prevData.map(month => {
          if (month.monthName === monthName) {
            const newPersonTotals = { ...month.personTotals };
            const newLucianaTotals = [...(newPersonTotals.luciana || [])];
            
            while (newLucianaTotals.length <= rowIndex) {
              newLucianaTotals.push(0);
            }
            newLucianaTotals[rowIndex] = newValue;
            
            newPersonTotals.luciana = newLucianaTotals;
            
            return { ...month, personTotals: newPersonTotals };
          }
          return month;
        });
        // Step 2: Recalculate the entire chain
        return recalculateFaturamentoChain(dataWithUserChange);
      });
    },
    [recalculateFaturamentoChain]
  );

  const handleAddIndividualTotalRow = useCallback((monthName: string) => {
    setFaturamentoData(prevData => {
        return prevData.map(month => {
            if (month.monthName === monthName) {
                const newPersonTotals = { ...month.personTotals };

                const lucianaTotals = [...(newPersonTotals.luciana || [])];
                const marciaTotals = [...(newPersonTotals.marcia || [])];
                const marceloTotals = [...(newPersonTotals.marcelo || [])];

                // Determine the max length before adding the new row
                const maxLength = Math.max(lucianaTotals.length, marciaTotals.length, marceloTotals.length);
                
                // Pad arrays to be of equal length
                while(lucianaTotals.length < maxLength) lucianaTotals.push(0);
                while(marciaTotals.length < maxLength) marciaTotals.push(0);
                while(marceloTotals.length < maxLength) marceloTotals.push(0);

                // Add the new row
                lucianaTotals.push(0);
                marciaTotals.push(0);
                marceloTotals.push(0);
                
                return { 
                    ...month, 
                    personTotals: {
                        luciana: lucianaTotals,
                        marcia: marciaTotals,
                        marcelo: marceloTotals,
                    } 
                };
            }
            return month;
        });
    });
  }, []);

  const handleDeleteIndividualTotalRow = useCallback(
    (monthName: string, rowIndex: number) => {
      setFaturamentoData(prevData => {
        const dataWithDeletion = prevData.map(month => {
          if (month.monthName === monthName) {
            const newPersonTotals = { ...month.personTotals };

            const luciana = [...newPersonTotals.luciana];
            const marcia = [...newPersonTotals.marcia];
            const marcelo = [...newPersonTotals.marcelo];

            if (rowIndex < luciana.length) luciana.splice(rowIndex, 1);
            if (rowIndex < marcia.length) marcia.splice(rowIndex, 1);
            if (rowIndex < marcelo.length) marcelo.splice(rowIndex, 1);

            return {
              ...month,
              personTotals: {
                luciana,
                marcia,
                marcelo,
              },
            };
          }
          return month;
        });

        return recalculateFaturamentoChain(dataWithDeletion);
      });
    },
    [recalculateFaturamentoChain]
  );

  const yearlyTotal = useMemo(() => {
    if (activeView === 'TabelaDeReferencia' || activeView === 'Faturamento') return 0;
    
    const activeAgenda = agendas[activeView] || [];
    
    const getReferenceData = (year: '2025' | '2026' | '2027') => {
      if (year === '2027') return courses2027Data;
      if (year === '2026') return courses2026Data;
      return COURSES_DATA;
    };
    const referenceData = getReferenceData(selectedReferenceYears[activeView]);

    return activeAgenda.slice(0, 12).reduce((total, month) => {
      const monthTotal = month.courses.reduce((acc, course) => {
        if ([Status.Cancelado, Status.Recusado].includes(course.status)) {
          return acc;
        }
        const courseData = referenceData.find(c => c.name === course.courseName);
        const courseValue = course.overriddenValue ?? courseData?.value ?? 0;
        return acc + courseValue;
      }, 0);
      return total + monthTotal;
    }, 0);
  }, [agendas, activeView, selectedReferenceYears, courses2026Data, courses2027Data]);

  const handleAgendaDragStart = (agendaName: string) => {
    setDraggedAgenda(agendaName);
  };

  const handleAgendaDragOver = (e: React.DragEvent, agendaName: string) => {
    e.preventDefault();
    if (!draggedAgenda || draggedAgenda === agendaName) return;
    const newOrder = [...agendaOrder];
    const draggedIndex = newOrder.indexOf(draggedAgenda);
    const targetIndex = newOrder.indexOf(agendaName);
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedAgenda);
    setAgendaOrder(newOrder);
  };

  const handleAgendaDragEnd = () => {
    setDraggedAgenda(null);
  };

  const renderContent = () => {
    if (activeView === 'TabelaDeReferencia') {
      const commonProps = { isPrivacyMode };
      
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 mb-4">
            {['2025', '2026', '2027'].map(year => (
              <button
                key={year}
                onClick={() => setActiveReferenceTabYear(year as '2025' | '2026' | '2027')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
                  activeReferenceTabYear === year
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {`Valor ${year}`}
              </button>
            ))}
          </div>

          {activeReferenceTabYear === '2025' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <ReferenceTable {...commonProps} />
                <AliquotaTable
                  aliquotaData={aliquotaData}
                  feesData={feesData}
                  onUpdateAliquota={handleUpdateAliquota}
                  onUpdateFee={handleUpdateFee}
                />
            </div>
          )}
          {activeReferenceTabYear === '2026' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <ReferenceTable2026 
                    courses={courses2026Data} 
                    onUpdateValue={handleUpdate2026CourseValue} 
                    {...commonProps} 
                />
                <AliquotaTable2026
                  aliquotaData={aliquotaData2026}
                  feesData={feesData2026}
                  onUpdateAliquota={handleUpdateAliquota2026}
                  onUpdateFee={handleUpdateFee2026}
                />
            </div>
          )}
          {activeReferenceTabYear === '2027' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <ReferenceTable2027
                    courses={courses2027Data} 
                    onUpdateValue={handleUpdate2027CourseValue} 
                    {...commonProps} 
                />
                <AliquotaTable2027
                  aliquotaData={aliquotaData2027}
                  feesData={feesData2027}
                  onUpdateAliquota={handleUpdateAliquota2027}
                  onUpdateFee={handleUpdateFee2027}
                />
            </div>
          )}
        </div>
      );
    }
    if (activeView === 'Faturamento') {
      return (
        <FaturamentoView 
          faturamentoData={faturamentoData} 
          isPrivacyMode={isPrivacyMode} 
          onUpdateFaturamentoEntry={handleUpdateFaturamentoEntry}
          onUpdateIndividualTotal={handleUpdateIndividualTotal}
          onAddIndividualTotalRow={handleAddIndividualTotalRow}
          onDeleteIndividualTotalRow={handleDeleteIndividualTotalRow}
          selectedAgendaReferenceYear={selectedReferenceYears['Márcia']}
        />
      );
    }
    
    const activeAgenda = agendas[activeView] || [];
    
    const getAvailableCourses = (): CourseDefinition[] => {
      if (activeView === 'Marcelo') {
        return MARCELO_COURSES_DATA;
      }
      if (activeView === 'Márcia') {
        return MARCIA_COURSES_DATA;
      }
      return COURSES_DATA;
    };

    const availableCourses = getAvailableCourses();
    const getReferenceData = (year: '2025' | '2026' | '2027') => {
      if (year === '2027') return courses2027Data;
      if (year === '2026') return courses2026Data;
      return COURSES_DATA;
    };
    const referenceYear = selectedReferenceYears[activeView as 'Marcelo' | 'Márcia'];
    const referenceData = getReferenceData(referenceYear);
    const year = parseInt(referenceYear, 10);
    const allCourses = activeAgenda.flatMap(month => month.courses); // Still used for calculating `monthlyHoursTotal` which is now removed
    
    return (
      <div className="space-y-6">
        {activeAgenda.map((monthData) => (
            <MonthCard
              key={`${activeView}-${monthData.id}`}
              monthAgenda={monthData}
              availableCourses={availableCourses}
              referenceCourses={referenceData}
              allLocations={allLocations}
              isPrivacyMode={isPrivacyMode}
              onAddCourse={(monthId) => handleAddCourse(activeView, monthId)}
              onUpdateCourse={(monthId, courseId, updatedCourse) => handleUpdateCourse(activeView, monthId, courseId, updatedCourse)}
              onDeleteCourse={(monthId, courseId) => handleDeleteCourse(activeView, monthId, courseId)}
              draggedCourseInfo={draggedCourseInfo}
              onCourseDragStart={(monthId, course) => handleCourseDragStart(activeView, monthId, course)}
              onCourseDrop={(destMonthId, targetCourseId) => handleCourseDrop(activeView, destMonthId, targetCourseId)}
              onCourseDragEnd={handleCourseDragEnd}
            />
          ))}
      </div>
    );
  };
  
  interface TabButtonProps {
      view: View; // Changed to accept all View types
      label: string;
      isDragged?: boolean;
      onDragStart?: () => void;
      onDragOver?: (e: React.DragEvent) => void;
      onDragEnd?: () => void;
  }

  const TabButton: React.FC<TabButtonProps> = ({view, label, isDragged, onDragStart, onDragOver, onDragEnd}) => {
    const isActive = activeView === view;
    // Only 'Marcelo', 'Márcia', and 'Faturamento' tabs are draggable.
    const isDraggable = view === 'Marcelo' || view === 'Márcia' || view === 'Faturamento'; 
    return (
        <button
          draggable={isDraggable}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onClick={() => {
            setActiveView(view);
          }}
          className={`relative px-3 py-2 text-sm sm:text-base font-medium transition-colors duration-200 focus:outline-none ${
            isActive
              ? 'text-green-400'
              : 'text-slate-400 hover:text-white'
          } ${isDragged ? 'opacity-50' : ''} ${isDraggable ? 'cursor-grab' : 'cursor-pointer'}`}
          aria-selected={isActive}
          role="tab"
        >
          {label}
          {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 rounded-full"></span>}
        </button>
    );
  }

  const AutoSaveIndicator = () => {
    if (autoSaveStatus === 'idle') {
      return <div className="w-[95px]">&nbsp;</div>; // Reserve space
    }
    const statusConfig = {
      saving: { text: 'Salvando...', icon: <CloudUploadIcon />, class: 'text-slate-400 animate-pulse' },
      saved: { text: 'Salvo!', icon: <CheckIcon />, class: 'text-green-400' },
    };
    const currentStatus = statusConfig[autoSaveStatus];
  
    return (
      <div className={`flex items-center justify-center w-[95px] gap-2 px-3 py-2 text-sm font-medium transition-all duration-300 ${currentStatus.class}`} aria-live="polite">
        {currentStatus.icon}
        <span>{currentStatus.text}</span>
      </div>
    );
  };
  
  const isAgendaView = activeView === 'Marcelo' || activeView === 'Márcia';
  const isFaturamentoView = activeView === 'Faturamento';

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-slate-300">
      <header className="bg-gray-800/80 backdrop-blur-lg shadow-sm sticky top-0 z-20">
        <div className={`${isFaturamentoView ? '' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center py-3">
            {/* Empty left column for spacing to ensure the title is truly centered */}
            <div />

            {/* Centered title */}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 truncate px-4">
              Agenda de Cursos SENAR - Fios e Panos LTDA
            </h1>
            
            {/* Right-aligned controls */}
            <div className="flex items-center justify-end gap-2 sm:gap-4">
              <AutoSaveIndicator />
              <button
                onClick={() => setIsPrivacyMode(prev => !prev)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                aria-label={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
              >
                {isPrivacyMode ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
            <nav className="flex items-center gap-1 sm:gap-2" role="tablist">
               {agendaOrder.map(agendaName => (
                 <TabButton
                   key={agendaName}
                   view={agendaName as Exclude<View, 'TabelaDeReferencia'>}
                   label={agendaName === 'Faturamento' ? 'Faturamento' : `Agenda ${agendaName}`}
                   isDragged={draggedAgenda === agendaName}
                   onDragStart={() => handleAgendaDragStart(agendaName)}
                   onDragOver={(e) => handleAgendaDragOver(e, agendaName)}
                   onDragEnd={handleAgendaDragEnd}
                 />
               ))}
               <div className="h-6 w-px bg-slate-700 mx-2"></div>
               {/* New Tab for Reference Tables */}
               <TabButton
                 view='TabelaDeReferencia'
                 label='Tabela de Referência'
               />
            </nav>
            
            <div className="flex items-center mt-2 sm:mt-0">
              {isAgendaView && (
                <>
                  <div className="flex items-baseline gap-2 sm:gap-4 font-bold text-base mr-4">
                    <span className="text-slate-400">Total Anual:</span>
                    <span className="text-green-400">
                      {isPrivacyMode 
                        ? 'R$ ••••••' 
                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(yearlyTotal)
                      }
                    </span>
                  </div>
                  <label htmlFor={`reference-year-select-${activeView}`} className="text-sm font-medium text-slate-400 mr-2 whitespace-nowrap">
                      Tabela:
                  </label>
                  <select
                      id={`reference-year-select-${activeView}`}
                      value={selectedReferenceYears[activeView]}
                      onChange={(e) => handleReferenceYearChange(activeView, e.target.value as '2025' | '2026' | '2027')}
                      className="p-1.5 text-sm rounded-md border-slate-600 bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                      aria-label="Selecionar tabela de referência de valor"
                  >
                      <option value="2025">Valor 2025</option>
                      <option value="2026">Valor 2026</option>
                      <option value="2027">Valor 2027</option>
                  </select>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className={`mx-auto p-4 sm:p-6 lg:p-8`} role="tabpanel" aria-labelledby={`${activeView}-tab`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;