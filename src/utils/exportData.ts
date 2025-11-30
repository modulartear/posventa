import { Sale, CashRegisterSession } from '../types';

export interface SessionExport {
  version: string;
  exportDate: string;
  session: CashRegisterSession;
  sales: Sale[];
}

export function exportSessionData(session: CashRegisterSession, sales: Sale[]): void {
  const exportData: SessionExport = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    session,
    sales,
  };

  // Convert to JSON
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create blob
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Generate filename with date and cash register info
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  link.download = `cierre_${session.cashRegisterName}_${date}_${time}.json`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('✅ Archivo de cierre exportado:', link.download);
}

export function validateImportData(data: any): data is SessionExport {
  if (!data || typeof data !== 'object') {
    throw new Error('Formato de archivo inválido');
  }
  
  if (!data.version || !data.exportDate || !data.session || !Array.isArray(data.sales)) {
    throw new Error('El archivo no contiene los datos necesarios');
  }
  
  if (!data.session.id || !data.session.cashRegisterId) {
    throw new Error('Datos de sesión incompletos');
  }
  
  return true;
}

export async function importSessionData(file: File): Promise<SessionExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (validateImportData(data)) {
          // Convert date strings back to Date objects
          data.session.openedAt = new Date(data.session.openedAt);
          if (data.session.closedAt) {
            data.session.closedAt = new Date(data.session.closedAt);
          }
          
          data.sales = data.sales.map((sale: any) => ({
            ...sale,
            date: new Date(sale.date),
          }));
          
          resolve(data);
        }
      } catch (error) {
        reject(new Error('Error al leer el archivo: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file);
  });
}
