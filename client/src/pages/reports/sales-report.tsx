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
import { addDays, format, startOfDay, subDays, isToday, parseISO } from "date-fns";
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
import { Bar, Pie } from 'react-chartjs-2';

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

// Type para os dados de resumo diário de vendas
type DailySalesSummary = {
  date: string;
  total: number;
  count: number;
};

// Type para produtos mais vendidos
type TopProductSummary = {
  id: number;
  name: string;
  quantity: number;
  total: number;
};

// Type para itens de venda simplificados
type SaleItemSimple = {
  productId: number;
  quantity: number;
  unitPrice: number | string;
};

export default function SalesReportPage() {
  const [timeFrame, setTimeFrame] = useState<'today' | '7days' | '30days' | '90days'>('7days');
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Calcular datas de início e fim com base no período selecionado
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    if (timeFrame === 'today') {
      startDate = startOfDay(endDate);
    } else if (timeFrame === '7days') {
      startDate = subDays(endDate, 7);
    } else if (timeFrame === '30days') {
      startDate = subDays(endDate, 30);
    } else if (timeFrame === '90days') {
      startDate = subDays(endDate, 90);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  
  // Buscar produtos (usado para referência em relatórios)
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Buscar resumo de vendas diárias
  const { data: salesSummary, isLoading: isLoadingSales } = useQuery<DailySalesSummary[]>({
    queryKey: ['/api/sales/summary/daily', { startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/summary/daily?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar resumo de vendas');
      }
      return response.json();
    }
  });

  // Mock dos dados de vendas diárias para desenvolvimento (remover quando API estiver implementada)
  const mockSalesSummary: DailySalesSummary[] = [];
  if (!salesSummary || salesSummary.length === 0) {
    // Apenas para o propósito de desenvolvimento, criaremos dados de exemplo
    const mockStartDate = subDays(new Date(), timeFrame === 'today' ? 0 : 
                                            timeFrame === '7days' ? 7 : 
                                            timeFrame === '30days' ? 30 : 90);
    
    for (let i = 0; i <= (timeFrame === 'today' ? 0 : 
                        timeFrame === '7days' ? 7 : 
                        timeFrame === '30days' ? 30 : 90); i++) {
      const currentDate = addDays(mockStartDate, i);
      if (i === 0 && timeFrame === 'today' && !isToday(currentDate)) continue;
      
      mockSalesSummary.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        total: Math.floor(Math.random() * 5000) + 500,
        count: Math.floor(Math.random() * 10) + 1
      });
    }
  }

  // Usar dados reais ou mock se não houver dados
  const displaySalesSummary = salesSummary && salesSummary.length > 0 
    ? salesSummary 
    : mockSalesSummary;
  
  // Mock dos produtos mais vendidos (remover quando API estiver implementada)
  const mockTopProducts: TopProductSummary[] = [];
  if (products && products.length > 0) {
    const usedProducts = new Set<number>();
    const availableProducts = [...products];
    
    for (let i = 0; i < Math.min(5, availableProducts.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableProducts.length);
      const product = availableProducts[randomIndex];
      
      if (!usedProducts.has(product.id)) {
        usedProducts.add(product.id);
        mockTopProducts.push({
          id: product.id,
          name: product.name,
          quantity: Math.floor(Math.random() * 50) + 5,
          total: parseFloat((Math.random() * 1000 + 100).toFixed(2))
        });
        
        // Remover o produto para evitar duplicatas
        availableProducts.splice(randomIndex, 1);
      }
    }
  }
  
  // Função para calcular produtos mais vendidos de uma lista de items de venda
  const calculateTopProducts = (saleItems: SaleItemSimple[] = [], productsList: Product[] = [], limit = 5): TopProductSummary[] => {
    if (!saleItems.length || !productsList.length) return mockTopProducts;
    
    // Agrupar por produto e somar quantidades e valores
    const productMap: Record<number, { quantity: number, total: number }> = {};
    
    saleItems.forEach(item => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = { quantity: 0, total: 0 };
      }
      
      const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
      
      productMap[item.productId].quantity += item.quantity;
      productMap[item.productId].total += item.quantity * unitPrice;
    });
    
    // Converter para array e ordenar por quantidade
    const topProducts = Object.entries(productMap)
      .map(([productId, data]) => {
        const product = productsList.find(p => p.id === parseInt(productId));
        return {
          id: parseInt(productId),
          name: product?.name || 'Produto não encontrado',
          quantity: data.quantity,
          total: data.total
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
    
    return topProducts.length > 0 ? topProducts : mockTopProducts;
  };

  // Por enquanto, usamos os dados mock diretamente, mas isso seria substituído por dados reais
  const topProducts = calculateTopProducts([], products || []);
  
  // Configurar dados para gráfico de barras de vendas
  const salesChartData = {
    labels: displaySalesSummary.map(item => {
      const date = typeof item.date === 'string' ? parseISO(item.date) : item.date;
      return isToday(date) ? 'Hoje' : format(date, 'dd/MM');
    }),
    datasets: [
      {
        label: 'Vendas (R$)',
        data: displaySalesSummary.map(item => item.total),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1,
      }
    ],
  };
  
  // Configurar dados para gráfico de pizza de produtos mais vendidos
  const topProductsChartData = {
    labels: topProducts.map(item => item.name),
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: topProducts.map(item => item.quantity),
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
        text: 'Vendas por Data',
      },
    },
  };
  
  // Calcular métricas resumidas
  const totalSales = displaySalesSummary.reduce((sum, item) => sum + item.total, 0);
  const totalTransactions = displaySalesSummary.reduce((sum, item) => sum + item.count, 0);
  const averageTicket = totalTransactions > 0 
    ? totalSales / totalTransactions 
    : 0;
  const totalItems = topProducts.reduce((sum, item) => sum + item.quantity, 0);
  
  // Manipulador para alternar entre intervalos de tempo (hoje, 7 dias, 30 dias, etc.)
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value as 'today' | '7days' | '30days' | '90days');
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
          timeFrame === 'today' 
            ? 'Hoje' 
            : timeFrame === '7days' 
              ? 'Últimos 7 dias' 
              : timeFrame === '30days' 
                ? 'Últimos 30 dias' 
                : 'Últimos 90 dias'
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
        const tableData = topProducts.map(product => [
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
            <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
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
              {timeFrame === 'today' 
                ? 'hoje' 
                : timeFrame === '7days' 
                  ? 'nos últimos 7 dias' 
                  : timeFrame === '30days' 
                    ? 'nos últimos 30 dias' 
                    : 'nos últimos 90 dias'}
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
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos Mais Vendidos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>
                Vendas {timeFrame === 'today' 
                  ? 'de hoje' 
                  : timeFrame === '7days' 
                    ? 'dos últimos 7 dias' 
                    : timeFrame === '30days' 
                      ? 'dos últimos 30 dias' 
                      : 'dos últimos 90 dias'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {isLoadingSales ? (
                <div className="flex items-center justify-center h-full">
                  <p>Carregando dados...</p>
                </div>
              ) : displaySalesSummary && displaySalesSummary.length > 0 ? (
                <Bar data={salesChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Nenhuma venda registrada no período selecionado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Top 5 produtos {timeFrame === 'today' 
                  ? 'de hoje' 
                  : timeFrame === '7days' 
                    ? 'dos últimos 7 dias' 
                    : timeFrame === '30days' 
                      ? 'dos últimos 30 dias' 
                      : 'dos últimos 90 dias'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {topProducts && topProducts.length > 0 ? (
                <Pie data={topProductsChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Nenhuma venda registrada no período selecionado.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {topProducts && topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes dos Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Produto</th>
                        <th className="py-2 text-right">Quantidade</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product) => (
                        <tr key={product.id} className="border-b">
                          <td className="py-2">{product.name}</td>
                          <td className="py-2 text-right">{product.quantity}</td>
                          <td className="py-2 text-right">{formatCurrency(product.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}