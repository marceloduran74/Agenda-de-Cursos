import { Status, CourseDefinition, MonthAgenda, AliquotaEntry, FeeEntry, FaturamentoMonthData } from './types';

export const STATUS_OPTIONS: Status[] = Object.values(Status).sort((a, b) =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
);

export const COURSES_DATA: CourseDefinition[] = [
  { name: 'Bordados a Mão', value: 2484, hours: 24 },
  { name: 'Macramê', value: 3312, hours: 32 },
  { name: 'Tecelagem com Lã Crua', value: 5440, hours: 40 },
  { name: 'Confecção com Lã Crua', value: 5440, hours: 40 },
  { name: 'Lã', value: 5440, hours: 40 },
  { name: 'CTI', value: 544, hours: 4 },
  { name: 'Inclusão Digital', value: 2176, hours: 16 },
  { name: 'Excel Básico', value: 3264, hours: 24 },
  { name: 'Informática Básica', value: 4352, hours: 32 },
  { name: 'Nota Fiscal Avulsa', value: 2176, hours: 16 },
  { name: 'CTG', value: 1088, hours: 8 },
];

export const INITIAL_ALIQUOTA_DATA: AliquotaEntry[] = [
  { month: 'Janeiro', value: '8,7028063908953' },
  { month: 'Fevereiro', value: '8,8048517942134' },
  { month: 'Março', value: '8,7665007061742' },
  { month: 'Abril', value: '8,8335677660003' },
  { month: 'Maio', value: '8,8434224614769' },
  { month: 'Junho', value: '8,7998477326521' },
  { month: 'Julho', value: '9,1123222011099' },
  { month: 'Agosto', value: '9,1843296566383' },
  { month: 'Setembro', value: '9,1418151138393' },
  { month: 'Outubro', value: '' },
  { month: 'Novembro', value: '' },
  { month: 'Dezembro', value: '' },
  { month: 'Janeiro Próximo', value: '' },
];

export const INITIAL_FEES_DATA: FeeEntry[] = [
    { label: 'Honorários 2024', value: '64200' },
    { label: 'INSS', value: '43560' },
    { label: 'Honorários 2025', value: '69000' },
    { label: 'INSS 2025', value: '50094' },
];

export const MONTH_NAMES: string[] = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  'Janeiro Próximo'
];

export const INITIAL_ALIQUOTA_DATA_2026: AliquotaEntry[] = MONTH_NAMES.map(month => ({ month, value: '' }));
export const INITIAL_FEES_DATA_2026: FeeEntry[] = INITIAL_FEES_DATA.map(fee => {
    switch(fee.label) {
        case 'Honorários 2024':
            return { ...fee, label: 'Honorários 2025' };
        case 'Honorários 2025':
            return { ...fee, label: 'Honorários 2026' };
        case 'INSS 2025':
            return { ...fee, label: 'INSS 2026' };
        default:
            return fee;
    }
});

export const INITIAL_COURSES_DATA_2027: CourseDefinition[] = JSON.parse(JSON.stringify(COURSES_DATA));
export const INITIAL_ALIQUOTA_DATA_2027: AliquotaEntry[] = MONTH_NAMES.map(month => ({ month, value: '' }));
export const INITIAL_FEES_DATA_2027: FeeEntry[] = INITIAL_FEES_DATA_2026.map(fee => {
    switch(fee.label) {
        case 'Honorários 2025':
            return { ...fee, label: 'Honorários 2026' };
        case 'Honorários 2026':
            return { ...fee, label: 'Honorários 2027' };
        case 'INSS 2026':
            return { ...fee, label: 'INSS 2027' };
        default:
            return fee;
    }
});


const MARCELO_COURSE_NAMES = ['Excel Básico', 'Inclusão Digital', 'Informática Básica', 'Nota Fiscal Avulsa'];
export const MARCELO_COURSES_DATA: CourseDefinition[] = COURSES_DATA.filter(course => MARCELO_COURSE_NAMES.includes(course.name));

export const MARCIA_COURSES_DATA: CourseDefinition[] = COURSES_DATA.filter(course => !MARCELO_COURSE_NAMES.includes(course.name));

const generateInitialAgenda = (): MonthAgenda[] => {
  return MONTH_NAMES.map((monthName, index) => ({
    id: `month-${index + 1}`,
    name: monthName,
    courses: [
      {
        id: `course-${crypto.randomUUID()}`,
        date: '',
        location: '',
        courseName: '',
        status: Status.Agendado,
      },
    ],
  }));
};

export const INITIAL_AGENDAS: Record<string, MonthAgenda[]> = {
  'Marcelo': generateInitialAgenda(),
  'Márcia': generateInitialAgenda(),
};

// Helper function to generate initial FaturamentoMonthData for a given month
const generateFaturamentoMonthData = (monthName: string, index: number): FaturamentoMonthData => {
  let honorariosPerPerson = 0;
  let inssPerPerson = 0;

  if (index === 0) {
    const honorarios2024Value = parseFloat(INITIAL_FEES_DATA.find(fee => fee.label === 'Honorários 2024')?.value || '0');
    honorariosPerPerson = (honorarios2024Value / 100) / 3;

    const inssValueFromFees = parseFloat(INITIAL_FEES_DATA.find(fee => fee.label === 'INSS')?.value || '0');
    inssPerPerson = (inssValueFromFees / 100) / 3;
  } else {
    const honorarios2025Value = parseFloat(INITIAL_FEES_DATA.find(fee => fee.label === 'Honorários 2025')?.value || '0');
    honorariosPerPerson = (honorarios2025Value / 100) / 3;

    const inss2025Value = parseFloat(INITIAL_FEES_DATA.find(fee => fee.label === 'INSS 2025')?.value || '0');
    inssPerPerson = (inss2025Value / 100) / 3;
  }

  const initialFaturamento = 0; // Default faturamento for entries
  const initialSimples = 0; // Default simples for entries, will be editable

  const entries = ['Luciana', 'Márcia', 'Marcelo'].map(person => {
    const honorarios = honorariosPerPerson;
    const inss = inssPerPerson;
    const simples = initialSimples;
    
    const valorTaxas = honorarios + inss + simples;
    const valorLiquido = initialFaturamento - valorTaxas;

    return { person, faturamento: initialFaturamento, honorarios, inss, simples, valorTaxas, valorLiquido };
  });

  const contadoraHonorariosMonth = honorariosPerPerson * 3;
  const inssTotalMonth = inssPerPerson * 3;
  const simplesTotal = entries.reduce((sum, entry) => sum + entry.simples, 0);
  const totalFaturamento = entries.reduce((sum, entry) => sum + entry.faturamento, 0);
  const totalLiquido = entries.reduce((sum, entry) => sum + entry.valorLiquido, 0);

  return {
    monthName,
    entries,
    contadoraHonorarios: contadoraHonorariosMonth,
    inssTotal: inssTotalMonth,
    simplesTotal,
    valorNota: totalFaturamento,
    personTotals: {
      luciana: [0], // Placeholder, will not be dynamically updated in this change without explicit rules
      marcia: [0],
      marcelo: [0],
    },
    grossNet: {
      bruto: totalFaturamento,
      liquido: totalLiquido,
    },
  };
};

export const INITIAL_FATURAMENTO_DATA: FaturamentoMonthData[] = MONTH_NAMES.map((monthName, index) => generateFaturamentoMonthData(monthName, index));