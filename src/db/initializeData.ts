import { db } from './database';
import { products as initialProducts } from '../data/products';

export async function initializeDatabase() {
  // Check if database is already initialized
  const productCount = await db.products.count();
  
  if (productCount === 0) {
    console.log('Inicializando base de datos con datos de ejemplo...');
    
    // Add initial products
    await db.products.bulkAdd(initialProducts);
    
    // Add demo employees
    await db.employees.bulkAdd([
      {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '1234567890',
        role: 'cashier',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'María García',
        email: 'maria@example.com',
        phone: '0987654321',
        role: 'cashier',
        isActive: true,
        createdAt: new Date(),
      },
    ]);
    
    // Add demo cash registers
    await db.cashRegisters.bulkAdd([
      {
        id: '1',
        name: 'Caja 1',
        employeeId: '1',
        employeeName: 'Juan Pérez',
        isActive: true,
        openingBalance: 10000,
        currentBalance: 10000,
        openedAt: new Date(),
        accessToken: 'caja1-demo-token-abc123',
      },
      {
        id: '2',
        name: 'Caja 2',
        employeeId: '2',
        employeeName: 'María García',
        isActive: false,
        openingBalance: 10000,
        currentBalance: 10000,
        accessToken: 'caja2-demo-token-xyz789',
      },
    ]);
    
    console.log('✅ Base de datos inicializada con éxito');
  } else {
    console.log('Base de datos ya inicializada');
  }
}
