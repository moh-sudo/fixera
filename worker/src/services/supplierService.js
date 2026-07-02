import { supabase } from '../supabase';
import { createSupplierDeliveryLeg } from './dispatchService';

export const SUPPLIER_STEPS = [
  { id: 'confirmed',        label: 'Confirmed',        icon: '✅' },
  { id: 'packing',          label: 'Packing',          icon: '📦' },
  { id: 'ready',            label: 'Ready',            icon: '🏷️' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: '🏍️' },
  { id: 'delivered',        label: 'Delivered',        icon: '🎉' },
];

export async function listSupplierOrders(supplierId) {
  const { data, error } = await supabase
    .from('supplier_orders')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function getOrder(id) {
  const { data, error } = await supabase
    .from('supplier_orders')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function acceptOrder(id) {
  const { error } = await supabase
    .from('supplier_orders')
    .update({ status: 'confirmed', fulfillment_stage: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Advance: confirmed → packing → ready (ready auto-dispatches a rider)
export async function setStage(id, stage, supplierProfile = null) {
  const stamp = {};
  if (stage === 'packing') stamp.packed_at = new Date().toISOString();
  if (stage === 'ready')   stamp.ready_at = new Date().toISOString();

  const { error } = await supabase
    .from('supplier_orders')
    .update({ status: stage, fulfillment_stage: stage, ...stamp, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;

  if (stage === 'ready') {
    try {
      const order = await getOrder(id);
      if (order) await createSupplierDeliveryLeg(order, supplierProfile);
    } catch (e) {
      console.warn('supplier delivery dispatch failed (non-fatal):', e);
    }
  }
}
