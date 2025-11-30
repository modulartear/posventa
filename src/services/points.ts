import { supabase } from '../lib/supabase';
import { CartItem } from '../types';
import { getLoyaltyProgram } from './loyalty';
import { upsertCustomerPoints } from './customers';

export interface PointsCalculationResult {
  pointsEarned: number;
  newBalance: number;
  programName: string;
}

export async function calculatePoints(
  companyId: string,
  total: number,
  itemCount: number
): Promise<number> {
  const program = await getLoyaltyProgram(companyId);
  
  if (!program || !program.isActive) {
    return 0;
  }

  // Check minimum requirements
  if (program.minPurchase && total < program.minPurchase) {
    return 0;
  }

  if (program.minItems && itemCount < program.minItems) {
    return 0;
  }

  // Calculate points based on type
  if (program.calculationType === 'amount') {
    const units = Math.floor(total / program.unitValue);
    return units * program.pointsPerUnit;
  } else {
    // quantity
    const units = Math.floor(itemCount / program.unitValue);
    return units * program.pointsPerUnit;
  }
}

export async function awardPoints(
  companyId: string,
  customerId: string,
  saleId: string,
  total: number,
  items: CartItem[]
): Promise<PointsCalculationResult | null> {
  const program = await getLoyaltyProgram(companyId);
  
  if (!program || !program.isActive) {
    return null;
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const pointsEarned = await calculatePoints(companyId, total, itemCount);

  if (pointsEarned <= 0) {
    return null;
  }

  // Update customer points
  const updatedPoints = await upsertCustomerPoints(companyId, customerId, pointsEarned);

  // Record transaction
  await supabase.from('point_transactions').insert([
    {
      company_id: companyId,
      customer_id: customerId,
      sale_id: saleId,
      points_change: pointsEarned,
      reason: 'Compra realizada',
      metadata: {
        total,
        itemCount,
        programType: program.calculationType,
      },
    },
  ]);

  return {
    pointsEarned,
    newBalance: updatedPoints.pointsBalance,
    programName: program.name,
  };
}
