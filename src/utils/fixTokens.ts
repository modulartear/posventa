import { supabase } from '../lib/supabase';

/**
 * Fix invalid tokens in cash registers
 * Run this once to fix existing tokens with special characters
 */
export async function fixInvalidTokens() {
  console.log('🔧 Fixing invalid tokens...');
  
  // Get all cash registers
  const { data: registers, error } = await supabase
    .from('cash_registers')
    .select('*');

  if (error) {
    console.error('Error loading cash registers:', error);
    return;
  }

  if (!registers || registers.length === 0) {
    console.log('No cash registers found');
    return;
  }

  let fixed = 0;

  for (const register of registers) {
    const token = register.access_token;
    
    // Check if token has invalid characters
    if (/[^a-z0-9-]/.test(token)) {
      console.log(`❌ Invalid token found: "${token}" for register: ${register.name}`);
      
      // Generate new safe token
      const safeName = register.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const randomPart = Math.random().toString(36).substring(2, 15);
      const newToken = `${safeName}-${randomPart}`;
      
      // Update in database
      const { error: updateError } = await supabase
        .from('cash_registers')
        .update({ access_token: newToken })
        .eq('id', register.id);

      if (updateError) {
        console.error(`Error updating token for ${register.name}:`, updateError);
      } else {
        console.log(`✅ Fixed token for ${register.name}: ${newToken}`);
        fixed++;
      }
    } else {
      console.log(`✓ Token OK for ${register.name}: ${token}`);
    }
  }

  console.log(`\n🎉 Fixed ${fixed} invalid tokens`);
  console.log('Please refresh the page to see the new tokens');
}

// Expose globally for console access
if (typeof window !== 'undefined') {
  (window as any).fixTokens = fixInvalidTokens;
  console.log('💡 Función disponible: fixTokens() - Arregla tokens inválidos');
  
  // Auto-fix on load (run once)
  const hasAutoFixed = sessionStorage.getItem('tokens_auto_fixed');
  if (!hasAutoFixed) {
    setTimeout(() => {
      console.log('🔧 Auto-fixing invalid tokens...');
      fixInvalidTokens().then(() => {
        sessionStorage.setItem('tokens_auto_fixed', 'true');
      });
    }, 2000); // Wait 2 seconds for Supabase to load
  }
}
