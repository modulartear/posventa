import { db } from './database';

export async function resetDatabase() {
  console.log('🗑️ Limpiando base de datos...');
  
  await db.products.clear();
  await db.employees.clear();
  await db.cashRegisters.clear();
  await db.sales.clear();
  await db.sessions.clear();
  
  console.log('✅ Base de datos limpiada');
}

export async function showDatabaseInfo() {
  console.log('📊 Información de la Base de Datos:');
  
  const products = await db.products.toArray();
  const employees = await db.employees.toArray();
  const cashRegisters = await db.cashRegisters.toArray();
  const sales = await db.sales.toArray();
  const sessions = await db.sessions.toArray();
  
  console.log('Productos:', products.length);
  console.log('Empleados:', employees.length);
  console.log('Cajas:', cashRegisters.length);
  console.log('Ventas:', sales.length);
  console.log('Sesiones:', sessions.length);
  
  console.log('\n📦 Cajas Registradas:');
  cashRegisters.forEach(reg => {
    console.log(`  - ${reg.name}:`);
    console.log(`    Token: ${reg.accessToken}`);
    console.log(`    Empleado: ${reg.employeeName}`);
    console.log(`    Estado: ${reg.isActive ? 'Activa' : 'Cerrada'}`);
  });
}

// Exponer funciones globalmente para uso en consola
if (typeof window !== 'undefined') {
  (window as any).resetDB = resetDatabase;
  (window as any).showDB = showDatabaseInfo;
  console.log('💡 Funciones disponibles en consola:');
  console.log('  - resetDB() - Limpia toda la base de datos');
  console.log('  - showDB() - Muestra información de la base de datos');
}
