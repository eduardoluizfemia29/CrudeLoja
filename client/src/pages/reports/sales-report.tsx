import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils/format";
import { FileDown, Printer, Calendar } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { addDays, format, startOfDay, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Gerar dados de exemplo para vendas (apenas para demonstração)
const generateSampleSalesData = () => {
  // Gera um número aleatório entre min e max
  const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
  
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  
  const dailySales = [];
  for (let i = 0; i < 30; i++) {
    const date = addDays(thirtyDaysAgo, i);
    dailySales.push({
      date,
      total: randomBetween(300, 2500),
      itemsSold: randomBetween(5, 25),
      transactions: randomBetween(1, 8)
    });
  }
  
  // Popular produtos mais vendidos
  const topProducts = [
    { id: 1, name: "Água", quantity: randomBetween(30, 100), total: randomBetween(150, 500) },
    { id: 2, name: "Pinga", quantity: randomBetween(20, 60), total: randomBetween(600, 1800) },
    { id: 3, name: "Fone de ouvido", quantity: randomBetween(5, 15), total: randomBetween(250, 750) },
    { id: 4, name: "Carro", quantity: randomBetween(1, 3), total: randomBetween(1000, 3000) },
  ];
  
  return { dailySales, topProducts };
};

// Função para agrupar vendas por período
const groupSalesByPeriod = (sales: any[], groupBy: 'day' | 'week' | 'month') => {
  const groupedSales: Record<string, { total: number, itemsSold: number, transactions: number }> = {};
  
  sales.forEach(sale => {
    let key = '';
    
    if (groupBy === 'day') {
      key = format(sale.date, 'yyyy-MM-dd');
    } else if (groupBy === 'week') {
      const weekStart = startOfWeek(sale.date, { locale: ptBR });
      key = format(weekStart, 'yyyy-MM-dd');
    } else if (groupBy === 'month') {
      key = format(sale.date, 'yyyy-MM');
    }
    
    if (!groupedSales[key]) {
      groupedSales[key] = { total: 0, itemsSold: 0, transactions: 0 };
    }
    
    groupedSales[key].total += sale.total;
    groupedSales[key].itemsSold += sale.itemsSold;
    groupedSales[key].transactions += sale.transactions;
  });
  
  return Object.entries(groupedSales).map(([date, data]) => ({
    date,
    ...data
  })).sort((a, b) => a.date.localeCompare(b.date));
};

export default function SalesReportPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeFrame, setTimeFrame] = useState<'7days' | '30days' | '90days' | '12months'>('30days');
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Buscar produtos (usado para referência em relatórios)
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Dados de exemplo (em um sistema real, estes viriam do backend)
  const sampleData = generateSampleSalesData();
  
  // Agrupar vendas com base no período selecionado
  const groupedSales = groupSalesByPeriod(
    sampleData.dailySales, 
    period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'
  );
  
  // Configurar dados para gráfico de barras de vendas
  const salesChartData = {
    labels: groupedSales.map(item => {
      if (period === 'daily') {
        return format(new Date(item.date), 'dd/MM');
      } else if (period === 'weekly') {
        return `Semana ${format(new Date(item.date), 'w')}`;
      } else {
        return format(new Date(item.date + '-01'), 'MMM/yyyy', { locale: ptBR });
      }
    }),
    datasets: [
      {
        label: 'Vendas (R$)',
        data: groupedSales.map(item => item.total),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1,
      }
    ],
  };
  
  // Configurar dados para gráfico de linha de quantidade de itens vendidos
  const itemsChartData = {
    labels: groupedSales.map(item => {
      if (period === 'daily') {
        return format(new Date(item.date), 'dd/MM');
      } else if (period === 'weekly') {
        return `Semana ${format(new Date(item.date), 'w')}`;
      } else {
        return format(new Date(item.date + '-01'), 'MMM/yyyy', { locale: ptBR });
      }
    }),
    datasets: [
      {
        label: 'Itens Vendidos',
        data: groupedSales.map(item => item.itemsSold),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        tension: 0.3,
      }
    ],
  };
  
  // Configurar dados para gráfico de pizza de produtos mais vendidos
  const topProductsChartData = {
    labels: sampleData.topProducts.map(item => item.name),
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: sampleData.topProducts.map(item => item.quantity),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Opções para gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: period === 'daily' 
          ? 'Vendas Diárias' 
          : period === 'weekly' 
            ? 'Vendas Semanais' 
            : 'Vendas Mensais',
      },
    },
  };
  
  // Calcular métricas resumidas
  const totalSales = groupedSales.reduce((sum, item) => sum + item.total, 0);
  const totalItems = groupedSales.reduce((sum, item) => sum + item.itemsSold, 0);
  const totalTransactions = groupedSales.reduce((sum, item) => sum + item.transactions, 0);
  const averageTicket = totalTransactions > 0 
    ? totalSales / totalTransactions 
    : 0;
  
  // Manipulador para alternar entre períodos (diário, semanal, mensal)
  const handlePeriodChange = (value: string) => {
    setPeriod(value as 'daily' | 'weekly' | 'monthly');
  };
  
  // Manipulador para alternar entre intervalos de tempo (7 dias, 30 dias, etc.)
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value as '7days' | '30days' | '90days' | '12months');
  };
  
  // Função para gerar PDF do relatório
  const generatePDF = async () => {
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        
        // Adicionar título
        pdf.setFontSize(20);
        pdf.text('Relatório de Vendas - Casa do Norte', 105, 15, { align: 'center' });
        
        // Adicionar informações do relatório
        pdf.setFontSize(12);
        pdf.text(`Período: ${
          period === 'daily' 
            ? 'Diário' 
            : period === 'weekly' 
              ? 'Semanal' 
              : 'Mensal'
        }`, 105, 25, { align: 'center' });
        
        pdf.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 30, { align: 'center' });
        
        // Adicionar imagem do relatório
        const imgWidth = pdf.internal.pageSize.getWidth() - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
        
        // Adicionar tabela de produtos mais vendidos
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Produtos Mais Vendidos', 105, 15, { align: 'center' });
        
        // Preparar dados para a tabela
        const tableData = sampleData.topProducts.map(product => [
          product.name,
          product.quantity.toString(),
          formatCurrency(product.total),
        ]);
        
        // Adicionar tabela
        autoTable(pdf, {
          head: [['Produto', 'Quantidade', 'Total (R$)']],
          body: tableData,
          startY: 25,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        // Adicionar resumo de métricas
        pdf.setFontSize(16);
        pdf.text('Resumo de Métricas', 105, 120, { align: 'center' });
        
        // Criar tabela de resumo
        autoTable(pdf, {
          head: [['Métrica', 'Valor']],
          body: [
            ['Total em Vendas', formatCurrency(totalSales)],
            ['Itens Vendidos', totalItems.toString()],
            ['Transações', totalTransactions.toString()],
            ['Ticket Médio', formatCurrency(averageTicket)],
          ],
          startY: 130,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        // Salvar o PDF
        pdf.save('relatorio-vendas-casa-do-norte.pdf');
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
      }
    }
  };
  
  // Função para imprimir relatório
  const printReport = () => {
    window.print();
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Relatório de Vendas</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="12months">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" onClick={generatePDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          
          <Button variant="outline" size="sm" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {period === 'daily' 
                ? 'nos últimos dias' 
                : period === 'weekly' 
                  ? 'nas últimas semanas' 
                  : 'nos últimos meses'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              unidades vendidas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              vendas concluídas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
            <p className="text-xs text-muted-foreground">
              por transação
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos Mais Vendidos</TabsTrigger>
          <TabsTrigger value="items">Quantidade de Itens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>
                {period === 'daily' 
                  ? 'Vendas diárias' 
                  : period === 'weekly' 
                    ? 'Vendas semanais' 
                    : 'Vendas mensais'} nos {timeFrame === '7days' 
                      ? 'últimos 7 dias' 
                      : timeFrame === '30days' 
                        ? 'últimos 30 dias' 
                        : timeFrame === '90days' 
                          ? 'últimos 90 dias' 
                          : 'últimos 12 meses'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <Bar data={salesChartData} options={chartOptions} height={300} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Vendas</CardTitle>
              <CardDescription>
                Detalhe de vendas por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-2 px-4 text-left font-semibold">Data</th>
                      <th className="py-2 px-4 text-left font-semibold">Transações</th>
                      <th className="py-2 px-4 text-left font-semibold">Itens Vendidos</th>
                      <th className="py-2 px-4 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSales.map((item, index) => (
                      <tr key={index} className={index % 2 ? "bg-muted/30" : "bg-white"}>
                        <td className="py-2 px-4">
                          {period === 'daily' 
                            ? format(new Date(item.date), 'dd/MM/yyyy')
                            : period === 'weekly'
                              ? `Semana ${format(new Date(item.date), 'w')} de ${format(new Date(item.date), 'yyyy')}`
                              : format(new Date(item.date + '-01'), 'MMMM yyyy', { locale: ptBR })
                          }
                        </td>
                        <td className="py-2 px-4">{item.transactions}</td>
                        <td className="py-2 px-4">{item.itemsSold}</td>
                        <td className="py-2 px-4 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50 font-medium">
                      <td className="py-2 px-4">Total</td>
                      <td className="py-2 px-4">{totalTransactions}</td>
                      <td className="py-2 px-4">{totalItems}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(totalSales)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>
                  Por quantidade vendida no período
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <Pie data={topProductsChartData} options={chartOptions} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Produtos</CardTitle>
                <CardDescription>
                  Lista detalhada dos produtos mais vendidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-2 px-4 text-left font-semibold">Produto</th>
                        <th className="py-2 px-4 text-center font-semibold">Quantidade</th>
                        <th className="py-2 px-4 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.topProducts.map((product, index) => (
                        <tr key={index} className={index % 2 ? "bg-muted/30" : "bg-white"}>
                          <td className="py-2 px-4 font-medium">{product.name}</td>
                          <td className="py-2 px-4 text-center">{product.quantity}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(product.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quantidade de Itens Vendidos</CardTitle>
              <CardDescription>
                Evolução da quantidade de itens vendidos
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <Line data={itemsChartData} options={chartOptions} height={300} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}