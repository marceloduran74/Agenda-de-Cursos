import React, { useMemo } from 'react';
import { FaturamentoMonthData } from '../types';
import { formatCurrency } from './MonthCard'; // Re-using the formatCurrency helper
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface FaturamentoViewProps {
  faturamentoData: FaturamentoMonthData[];
  isPrivacyMode: boolean;
  onUpdateFaturamentoEntry: (monthName: string, person: string, field: 'simples', newValue: number) => void;
  onUpdateIndividualTotal: (monthName: string, rowIndex: number, newValue: number) => void;
  onAddIndividualTotalRow: (monthName: string) => void;
  onDeleteIndividualTotalRow: (monthName: string, rowIndex: number) => void;
  selectedAgendaReferenceYear: string; // New prop for the selected reference year
}

// Helper for currency formatting with privacy mode
const formatCurrencyWithPrivacy = (value: number, isPrivacyMode: boolean, compact = false): string => {
  if (isPrivacyMode) return 'R$ ••••••';
  if (compact) {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return formatCurrency(value);
};

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, className }) => (
    <div className={`bg-slate-800 p-6 rounded-lg shadow-lg shadow-black/20 ${className}`}>
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
);

interface FaturamentoHeaderStatsProps {
    faturamentoData: FaturamentoMonthData[];
    isPrivacyMode: boolean;
}

const FaturamentoHeaderStats: React.FC<FaturamentoHeaderStatsProps> = ({ faturamentoData, isPrivacyMode }) => {
    const annualTotals = useMemo(() => {
        return faturamentoData.slice(0, 12).reduce((acc, month) => {
            acc.bruto += month.grossNet.bruto;
            acc.liquido += month.grossNet.liquido;
            acc.taxas += month.entries.reduce((sum, entry) => sum + entry.valorTaxas, 0);
            return acc;
        }, { bruto: 0, liquido: 0, taxas: 0 });
    }, [faturamentoData]);

    return (
        <div className="sticky top-[84px] z-10 bg-gray-900 pb-6 pt-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"> {/* Added negative margins to stretch full width of main container, and padding for sticky effect */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Faturamento Bruto Anual"
                    value={formatCurrencyWithPrivacy(annualTotals.bruto, isPrivacyMode)}
                    description="Total de todas as notas emitidas no ano."
                    className="text-slate-100"
                />
                <StatCard 
                    title="Faturamento Líquido Anual"
                    value={formatCurrencyWithPrivacy(annualTotals.liquido, isPrivacyMode)}
                    description="Receita após todas as taxas e despesas."
                    className="text-green-400"
                />
                <StatCard 
                    title="Total de Taxas e Impostos"
                    value={formatCurrencyWithPrivacy(annualTotals.taxas, isPrivacyMode)}
                    description="Soma de INSS, Simples e honorários."
                    className="text-red-400"
                />
            </div>
        </div>
    );
};


// Helper to calculate moving average
const calculateMovingAverage = (values: number[], windowSize: number): number[] => {
  return values.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const end = i + 1;
    const slice = values.slice(start, end);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / slice.length;
  });
};

interface BarChartProps {
    data: FaturamentoMonthData[];
    isPrivacyMode: boolean;
    selectedAgendaReferenceYear: string; // New prop
}

const BarChart: React.FC<BarChartProps> = ({ data, isPrivacyMode, selectedAgendaReferenceYear }) => {
    const chartData = useMemo(() => {
        return data.slice(0, 12).map(month => ({
            name: month.monthName.substring(0, 3),
            bruto: month.grossNet.bruto,
            liquido: month.grossNet.liquido,
        }));
    }, [data]);

    const maxValue = useMemo(() => {
        const maxBruto = Math.max(...chartData.map(d => d.bruto));
        const maxLiquido = Math.max(...chartData.map(d => d.liquido));
        return Math.ceil(Math.max(maxBruto, maxLiquido, 1) / 10000) * 10000; // Round up to nearest 10k, min 1 for non-zero scaling
    }, [chartData]);
    
    const brutoValues = chartData.map(d => d.bruto);
    const liquidoValues = chartData.map(d => d.liquido);

    const brutoMA = useMemo(() => calculateMovingAverage(brutoValues, 3), [brutoValues]);
    const liquidoMA = useMemo(() => calculateMovingAverage(liquidoValues, 3), [liquidoValues]);

    if (isPrivacyMode) {
      return <div className="flex items-center justify-center h-full bg-slate-800 rounded-lg p-6 text-slate-500">Os dados do gráfico estão ocultos.</div>
    }

    const chartHeight = 250;
    const chartWidth = 700; // Adjusted width for better spacing
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    const barWidth = innerWidth / chartData.length;
    const barGap = 0.1; // 10% gap between bar groups

    return (
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg shadow-black/20">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Performance Anual (Bruto vs. Líquido) - Valores de {selectedAgendaReferenceYear}</h3>
        
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight}>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Y-axis */}
                <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#475569" strokeWidth="1" />
                {Array.from({ length: 3 }).map((_, i) => {
                    const value = maxValue * (1 - i / 2); // 1, 0.5, 0
                    const y = innerHeight * (i / 2);
                    return (
                        <g key={i}>
                            <line x1="0" y1={y} x2={innerWidth} y2={y} stroke="#475569" strokeDasharray="2 2" strokeWidth="0.5" />
                            <text x="-10" y={y + 5} textAnchor="end" className="text-xs text-slate-400 fill-current">
                                {formatCurrencyWithPrivacy(value, false, true)}
                            </text>
                        </g>
                    );
                })}
                <text x="-30" y={innerHeight / 2} textAnchor="middle" transform={`rotate(-90, -30, ${innerHeight / 2})`} className="text-xs text-slate-400 fill-current">
                    Valor
                </text>

                {/* Bars and X-axis labels */}
                {chartData.map((month, i) => {
                    const x = i * barWidth;
                    const brutoBarHeight = (month.bruto / maxValue) * innerHeight;
                    const liquidoBarHeight = (month.liquido / maxValue) * innerHeight;
                    
                    const barGroupWidth = barWidth * (1 - barGap);
                    const singleBarWidth = barGroupWidth / 2;
                    const offset = barWidth * barGap / 2;

                    return (
                        <g key={month.name} transform={`translate(${x + offset}, 0)`}>
                            {/* Bruto Bar */}
                            <rect
                                x="0"
                                y={innerHeight - brutoBarHeight}
                                width={singleBarWidth}
                                height={brutoBarHeight}
                                fill="#2563eb" // Blue for Bruto
                                className="hover:fill-blue-500 transition-all duration-150"
                            >
                                <title>Bruto {month.name}: {formatCurrency(month.bruto)}</title>
                            </rect>
                            {/* Líquido Bar */}
                            <rect
                                x={singleBarWidth}
                                y={innerHeight - liquidoBarHeight}
                                width={singleBarWidth}
                                height={liquidoBarHeight}
                                fill="#16a34a" // Green for Líquido
                                className="hover:fill-green-500 transition-all duration-150"
                            >
                                <title>Líquido {month.name}: {formatCurrency(month.liquido)}</title>
                            </rect>
                            {/* X-axis label */}
                            <text x={barWidth / 2 - offset} y={innerHeight + 20} textAnchor="middle" className="text-xs text-slate-500 fill-current">
                                {month.name}
                            </text>
                        </g>
                    );
                })}

                {/* Moving Average Lines */}
                <path
                    d={brutoMA.map((val, i) => {
                        const x = i * barWidth + barWidth / 2;
                        const y = innerHeight - (val / maxValue) * innerHeight;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#60a5fa" // Lighter blue for Bruto MA
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <title>Média Móvel Bruto (3 meses)</title>
                </path>
                <path
                    d={liquidoMA.map((val, i) => {
                        const x = i * barWidth + barWidth / 2;
                        const y = innerHeight - (val / maxValue) * innerHeight;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#4ade80" // Lighter green for Líquido MA
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                     <title>Média Móvel Líquido (3 meses)</title>
                </path>
            </g>
        </svg>

        <div className="flex flex-wrap justify-center items-center gap-6 mt-4 text-sm text-slate-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-600"></div><span>Bruto</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-600"></div><span>Líquido</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-0.5 border-t-2 border-blue-400"></div><span>Média Bruto</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-0.5 border-t-2 border-green-400"></div><span>Média Líquido</span></div>
        </div>
      </div>
    );
};

interface FaturamentoDashboardContentProps { // Renamed from FaturamentoDashboard
    faturamentoData: FaturamentoMonthData[];
    isPrivacyMode: boolean;
    selectedAgendaReferenceYear: string;
}

const FaturamentoDashboardContent: React.FC<FaturamentoDashboardContentProps> = ({ faturamentoData, isPrivacyMode, selectedAgendaReferenceYear }) => {
    return (
        <>
            <BarChart data={faturamentoData} isPrivacyMode={isPrivacyMode} selectedAgendaReferenceYear={selectedAgendaReferenceYear} />
        </>
    );
};


export const FaturamentoView: React.FC<FaturamentoViewProps> = ({ 
    faturamentoData, 
    isPrivacyMode, 
    onUpdateFaturamentoEntry,
    onUpdateIndividualTotal,
    onAddIndividualTotalRow,
    onDeleteIndividualTotalRow,
    selectedAgendaReferenceYear,
}) => {
  const cellClasses = "px-3 py-2 border border-slate-700 text-slate-300";
  const headerClasses = "px-3 py-2 text-left bg-slate-700 text-slate-400 text-xs uppercase font-semibold border border-slate-700 tracking-wider";
  const greenBgClass = "bg-green-800/40 font-medium"; // For totals
  const redTextClass = "text-red-400 font-medium"; // For negative values
  
  const inputClasses = "w-full text-right bg-transparent border-0 rounded-none p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-slate-600";

  return (
    <div className="space-y-8">
      {/* Sticky Header Stats */}
      <FaturamentoHeaderStats faturamentoData={faturamentoData} isPrivacyMode={isPrivacyMode} />

      {/* Main content, pushed down by the sticky header stats */}
      <div className="pt-0"> {/* Adjusted padding-top here. The pt-4 on FaturamentoHeaderStats provides initial spacing. */}
        <FaturamentoDashboardContent faturamentoData={faturamentoData} isPrivacyMode={isPrivacyMode} selectedAgendaReferenceYear={selectedAgendaReferenceYear} />

        {faturamentoData.map(monthData => {
          // Calculate sub-totals for Márcia and Marcelo for the summary table
          const marciaEntry = monthData.entries.find(entry => entry.person === 'Márcia');
          const marceloEntry = monthData.entries.find(entry => entry.person === 'Marcelo');

          const subTotalBruto = (marciaEntry?.faturamento || 0) + (marceloEntry?.faturamento || 0);
          const subTotalLiquido = (marciaEntry?.valorLiquido || 0) + (marceloEntry?.valorLiquido || 0);

          return (
            <div key={monthData.monthName} className="bg-slate-800 rounded-lg shadow-lg shadow-black/20 overflow-hidden mt-8"> {/* Added mt-8 for spacing between chart and first month */}
              <div className="p-4 bg-slate-700/50 border-b border-slate-700">
                <h2 className="text-xl font-bold text-slate-100">{monthData.monthName}</h2>
              </div>
              <div className="flex flex-col lg:flex-row p-4 gap-6">
                {/* Main Faturamento Table */}
                <div className="flex-1 min-w-0"> {/* Removed overflow-x-auto */}
                  <table className="w-full text-sm border-collapse table-fixed"> {/* Added table-fixed */}
                    <thead>
                      <tr>
                        <th className={`${headerClasses} w-[90px]`}></th>
                        <th className={`${headerClasses} text-center whitespace-nowrap w-[90px]`}>Faturamento</th>
                        <th className={`${headerClasses} text-center whitespace-nowrap w-[80px]`}>Honorários</th>
                        <th className={`${headerClasses} text-center whitespace-nowrap w-[80px]`}>INSS</th>
                        <th className={`${headerClasses} text-center whitespace-nowrap w-[90px]`}>Simples</th>
                        <th className={`${headerClasses} text-center whitespace-nowrap w-[90px]`}>Valor Taxas</th>
                        <th className={`${headerClasses} text-center whitespace-nowrap w-[90px]`}>Valor Líquido</th>
                        <th className={`${headerClasses} text-center whitespace-nowrap w-[120px]`}>Valor Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {monthData.entries.map((entry, index) => {
                        const isSimplesEditable = monthData.monthName === 'Janeiro';
                        const formattedSimples = formatCurrency(entry.simples);
                        return (
                          <tr key={entry.person}>
                            <td className={`${cellClasses} font-medium text-slate-100 bg-slate-700/50`}>{entry.person}</td>
                            <td className={`${cellClasses} text-right whitespace-nowrap`}>
                              {formatCurrencyWithPrivacy(entry.faturamento, isPrivacyMode)}
                            </td>
                            <td className={`${cellClasses} text-right whitespace-nowrap`}>{formatCurrencyWithPrivacy(entry.honorarios, isPrivacyMode)}</td>
                            <td className={`${cellClasses} text-right whitespace-nowrap`}>{formatCurrencyWithPrivacy(entry.inss, isPrivacyMode)}</td>
                            <td className={`${cellClasses} text-right p-0`}>
                              {isPrivacyMode ? (
                                <span className="block px-3 py-2 text-right">R$ ••••••</span>
                              ) : (
                                <input
                                  type="text"
                                  disabled={!isSimplesEditable}
                                  value={formattedSimples}
                                  onChange={(e) => {
                                    if (isSimplesEditable) {
                                        const rawValue = e.target.value;
                                        const digits = rawValue.replace(/\D/g, '');
                                        const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
                                        onUpdateFaturamentoEntry(monthData.monthName, entry.person, 'simples', numericValue);
                                    }
                                  }}
                                  className={`${inputClasses} text-right ${!isSimplesEditable ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : ''}`}
                                  aria-label={`Simples para ${entry.person} em ${monthData.monthName}`}
                                />
                              )}
                            </td>
                            <td className={`${cellClasses} text-right whitespace-nowrap`}>{formatCurrencyWithPrivacy(entry.valorTaxas, isPrivacyMode)}</td>
                            <td className={`${cellClasses} text-right whitespace-nowrap ${entry.valorLiquido < 0 ? redTextClass : ''}`}>
                              {formatCurrencyWithPrivacy(entry.valorLiquido, isPrivacyMode)}
                            </td>
                            {index === 0 && (
                              <td rowSpan={6} className={`${cellClasses} text-center align-middle text-lg font-bold bg-green-800/40 border-l-4 border-slate-600 whitespace-nowrap text-slate-100`}>
                                {formatCurrencyWithPrivacy(monthData.valorNota, isPrivacyMode)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      <tr>
                        <td className={`${cellClasses} font-medium text-slate-100 bg-slate-700/50`}>Contadora</td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses} text-right ${greenBgClass}`}>{formatCurrencyWithPrivacy(monthData.contadoraHonorarios, isPrivacyMode)}</td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                      </tr>
                      <tr>
                        <td className={`${cellClasses} font-medium text-slate-100 bg-slate-700/50`}>INSS Total</td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses} text-right ${greenBgClass}`}>{formatCurrencyWithPrivacy(monthData.inssTotal, isPrivacyMode)}</td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                      </tr>
                      <tr>
                        <td className={`${cellClasses} font-medium text-slate-100 bg-slate-700/50`}>Simples Total</td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses} text-right ${greenBgClass}`}>{formatCurrencyWithPrivacy(monthData.simplesTotal, isPrivacyMode)}</td>
                        <td className={`${cellClasses}`}></td>
                        <td className={`${cellClasses}`}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Side Tables: Person Totals and Gross/Net */}
                <div className="flex-shrink-0 w-full lg:w-[520px] flex flex-col gap-4">
                  {/* Individual Person Totals Table with Legend */}
                  <div>
                    <h3 className="text-md font-semibold text-slate-200 mb-2">Totais Individuais</h3>
                    <div className="border border-slate-700 rounded-lg flex flex-col">
                      <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse table-fixed">
                          <thead>
                              <tr>
                                <th className={`${headerClasses} w-[130px]`}>Luciana</th>
                                <th className={`${headerClasses} w-[130px]`}>Márcia</th>
                                <th className={`${headerClasses} w-[130px]`}>Marcelo</th>
                                <th className={`${headerClasses} w-[50px]`}></th>
                              </tr>
                          </thead>
                          <tbody>
                              {monthData.personTotals.marcia.map((_, rowIndex) => {
                                  const formattedLuciana = formatCurrency(monthData.personTotals.luciana[rowIndex] || 0);
                                  return (
                                  <tr key={rowIndex} className="border-b border-slate-700 last:border-b-0">
                                      <td className={`${cellClasses} text-right p-0`}>
                                        {isPrivacyMode ? (
                                          <span className="px-3 py-2 block">R$ ••••••</span>
                                        ) : (
                                          <input
                                            type="text"
                                            value={formattedLuciana}
                                            onChange={(e) => {
                                              const rawValue = e.target.value;
                                              const digits = rawValue.replace(/\D/g, '');
                                              const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
                                              onUpdateIndividualTotal(monthData.monthName, rowIndex, numericValue);
                                            }}
                                            className={inputClasses}
                                            aria-label={`Total individual para Luciana, linha ${rowIndex + 1}`}
                                          />
                                        )}
                                      </td>
                                      <td className={`${cellClasses} text-right`}>
                                          {formatCurrencyWithPrivacy(monthData.personTotals.marcia[rowIndex] || 0, isPrivacyMode)}
                                      </td>
                                      <td className={`${cellClasses} text-right`}>
                                          {formatCurrencyWithPrivacy(monthData.personTotals.marcelo[rowIndex] || 0, isPrivacyMode)}
                                      </td>
                                      <td className={`${cellClasses} text-center`}>
                                          <button
                                              onClick={() => onDeleteIndividualTotalRow(monthData.monthName, rowIndex)}
                                              className="p-1.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                                              aria-label={`Excluir linha ${rowIndex + 1}`}
                                          >
                                              <TrashIcon />
                                          </button>
                                      </td>
                                  </tr>
                                  )
                              })}
                          </tbody>
                          <tfoot>
                              <tr className="border-t-2 border-slate-600">
                                  <td className={`${cellClasses} text-right ${greenBgClass}`}>
                                      {formatCurrencyWithPrivacy(monthData.personTotals.luciana.reduce((sum, val) => sum + val, 0), isPrivacyMode)}
                                  </td>
                                  <td className={`${cellClasses} text-right ${greenBgClass}`}>
                                      {formatCurrencyWithPrivacy(monthData.personTotals.marcia.reduce((sum, val) => sum + val, 0), isPrivacyMode)}
                                  </td>
                                  <td className={`${cellClasses} text-right ${greenBgClass}`}>
                                      {formatCurrencyWithPrivacy(monthData.personTotals.marcelo.reduce((sum, val) => sum + val, 0), isPrivacyMode)}
                                  </td>
                                  <td className={cellClasses}></td>
                              </tr>
                          </tfoot>
                          </table>
                      </div>
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => onAddIndividualTotalRow(monthData.monthName)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-600 text-slate-400 font-semibold rounded-lg hover:bg-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors text-sm"
                        aria-label={`Adicionar linha de totais para ${monthData.monthName}`}
                      >
                        <PlusIcon />
                        Adicionar Linha
                      </button>
                    </div>
                  </div>

                  {/* Gross/Net Summary Table */}
                  <div className="overflow-x-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        <tr>
                          <td className={`${cellClasses} font-medium text-slate-100 w-1/2`}>Total Bruto</td>
                          <td className={`${cellClasses} text-right w-1/2`}>{formatCurrencyWithPrivacy(subTotalBruto, isPrivacyMode)}</td>
                        </tr>
                        <tr>
                          <td className={`${cellClasses} font-medium text-slate-100 w-1/2 ${greenBgClass}`}>Total Líquido</td>
                          <td className={`${cellClasses} text-right w-1/2 ${greenBgClass}`}>{formatCurrencyWithPrivacy(subTotalLiquido, isPrivacyMode)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};