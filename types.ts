
export enum Status {
  Agendado = 'Agendado',
  Analise = 'Análise',
  Aprovado = 'Aprovado',
  Cancelado = 'CANCELADO',
  Confirmar = 'Confirmar',
  Execucao = 'Execução',
  Fechamento = 'Fechamento',
  Realizado = 'Realizado',
  Recusado = 'RECUSADO',
}

export interface CourseDefinition {
  name: string;
  value: number;
  hours: number;
}

export interface CourseEntry {
  id: string;
  date: string;
  location: string;
  courseName: string;
  status: Status;
  overriddenValue?: number;
  overriddenHours?: number;
}

export interface MonthAgenda {
  id: string;
  name: string;
  courses: CourseEntry[];
}

export interface AliquotaEntry {
  month: string;
  value: string;
}

export interface FeeEntry {
  label: string;
  value: string;
}

export interface FaturamentoMonthData {
  monthName: string;
  entries: {
    person: string;
    faturamento: number;
    honorarios: number;
    inss: number;
    simples: number;
    valorTaxas: number;
    valorLiquido: number;
  }[];
  contadoraHonorarios: number;
  inssTotal: number;
  simplesTotal: number;
  valorNota: number;
  personTotals: {
    luciana: number[];
    marcia: number[];
    marcelo: number[];
  };
  grossNet: {
    bruto: number;
    liquido: number;
  };
}