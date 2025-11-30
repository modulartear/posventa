import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { Upload, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import { importSessionData, SessionExport } from '../../utils/exportData';
import { useAdmin } from '../../contexts/AdminContext';
import { formatCurrency } from '../../lib/utils';

export default function ImportData() {
  const { addSale, sessions, sales } = useAdmin();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    data?: SessionExport;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const data = await importSessionData(file);
      
      // Check if session already exists
      const existingSession = sessions.find(s => s.id === data.session.id);
      if (existingSession) {
        setImportResult({
          success: false,
          message: '⚠️ Esta sesión ya fue importada anteriormente',
          data,
        });
        setImporting(false);
        return;
      }

      // Check for duplicate sales
      const existingSaleIds = new Set(sales.map(s => s.id));
      const newSales = data.sales.filter(sale => !existingSaleIds.has(sale.id));
      
      if (newSales.length === 0) {
        setImportResult({
          success: false,
          message: '⚠️ Todas las ventas de este archivo ya fueron importadas',
          data,
        });
        setImporting(false);
        return;
      }

      // Import sales
      for (const sale of newSales) {
        await addSale(sale);
      }

      setImportResult({
        success: true,
        message: `✅ Importación exitosa: ${newSales.length} ventas agregadas`,
        data,
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: `❌ Error: ${(error as Error).message}`,
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Importar Datos de Cierre</h2>
        <p className="text-muted-foreground">
          Importa archivos JSON generados al cerrar cajas desde los terminales POS
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Seleccionar Archivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Arrastra un archivo o haz click para seleccionar</p>
            <p className="text-sm text-muted-foreground mb-4">
              Archivos JSON generados al cerrar caja
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={handleButtonClick} disabled={importing} className="gap-2">
              <Upload className="h-4 w-4" />
              {importing ? 'Importando...' : 'Seleccionar Archivo'}
            </Button>
          </div>

          {importResult && (
            <div className={`p-4 rounded-lg border-2 ${
              importResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium mb-2">{importResult.message}</p>
                  {importResult.data && (
                    <div className="text-sm space-y-1 mt-3 bg-white/50 p-3 rounded">
                      <p><strong>Caja:</strong> {importResult.data.session.cashRegisterName}</p>
                      <p><strong>Cajero:</strong> {importResult.data.session.employeeName}</p>
                      <p><strong>Fecha:</strong> {new Date(importResult.data.session.openedAt).toLocaleString('es-AR')}</p>
                      <p><strong>Total ventas:</strong> {importResult.data.sales.length}</p>
                      <p><strong>Total efectivo:</strong> {formatCurrency(importResult.data.session.totalCash)}</p>
                      <p><strong>Total tarjeta:</strong> {formatCurrency(importResult.data.session.totalCard)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              1
            </div>
            <p>Al cerrar una caja desde el POS, se descarga automáticamente un archivo JSON</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              2
            </div>
            <p>Guarda ese archivo en una ubicación segura (USB, carpeta compartida, etc.)</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              3
            </div>
            <p>Desde este panel admin, importa el archivo para sincronizar las ventas</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              4
            </div>
            <p>El sistema detecta automáticamente datos duplicados y solo importa ventas nuevas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
