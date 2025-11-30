import { supabase } from '../lib/supabase';
import { LoyaltyProgram, LoyaltyCalculationType } from '../types';

export interface LoyaltyProgramInput {
  name: string;
  calculationType: LoyaltyCalculationType;
  pointsPerUnit: number;
  unitValue: number;
  minPurchase?: number;
  minItems?: number;
  isActive: boolean;
  rewardThresholdPoints?: number;
  rewardLabel?: string;
}

function mapToLoyaltyProgram(data: any): LoyaltyProgram {
  return {
    id: data.id,
    companyId: data.company_id,
    name: data.name,
    calculationType: data.calculation_type,
    pointsPerUnit: data.points_per_unit,
    unitValue: Number(data.unit_value ?? 0),
    minPurchase: data.min_purchase !== null ? Number(data.min_purchase) : undefined,
    minItems: data.min_items !== null ? Number(data.min_items) : undefined,
    isActive: data.is_active,
    rewardThresholdPoints: data.reward_threshold_points !== null ? Number(data.reward_threshold_points) : undefined,
    rewardLabel: data.reward_label || undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
}

export async function getLoyaltyProgram(companyId: string): Promise<LoyaltyProgram | null> {
  const { data, error } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToLoyaltyProgram(data);
}

export async function saveLoyaltyProgram(companyId: string, input: LoyaltyProgramInput): Promise<LoyaltyProgram> {
  const payload = {
    company_id: companyId,
    name: input.name,
    calculation_type: input.calculationType,
    points_per_unit: input.pointsPerUnit,
    unit_value: input.unitValue,
    min_purchase: input.minPurchase ?? null,
    min_items: input.minItems ?? null,
    is_active: input.isActive,
    reward_threshold_points: input.rewardThresholdPoints ?? null,
    reward_label: input.rewardLabel ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('loyalty_programs')
    .upsert(payload, {
      onConflict: 'company_id',
      ignoreDuplicates: false,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error || new Error('No se pudo guardar el programa de puntos');
  }

  return mapToLoyaltyProgram(data);
}
