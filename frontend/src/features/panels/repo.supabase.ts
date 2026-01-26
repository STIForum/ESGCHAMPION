/**
 * Panels Repository - Supabase Implementation
 */

import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/schema'
import type { Panel, Indicator } from '@/lib/supabase/types'
import type { IPanelsRepository } from './repo.interface'

export class PanelsRepository implements IPanelsRepository {
  async getPanels(): Promise<Panel[]> {
    const { data, error } = await supabase
      .from(Tables.PANELS)
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  async getPanel(id: string): Promise<Panel | null> {
    const { data, error } = await supabase
      .from(Tables.PANELS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  async getIndicatorsByPanel(panelId: string): Promise<Indicator[]> {
    const { data, error } = await supabase
      .from(Tables.INDICATORS)
      .select('*')
      .eq('panel_id', panelId)
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  async getIndicator(id: string): Promise<Indicator | null> {
    const { data, error } = await supabase
      .from(Tables.INDICATORS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  async getAllIndicators(): Promise<Indicator[]> {
    const { data, error } = await supabase
      .from(Tables.INDICATORS)
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}

export const panelsRepository = new PanelsRepository()
