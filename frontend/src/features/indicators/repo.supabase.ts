/**
 * Indicators Repository - Supabase Implementation
 */

import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/schema'
import type { Indicator } from '@/lib/supabase/types'
import type { IIndicatorsRepository } from './repo.interface'
import type { IndicatorWithPanel, IndicatorFilters } from './types'

export class IndicatorsRepository implements IIndicatorsRepository {
  async getIndicatorsByPanel(panelId: string): Promise<Indicator[]> {
    const { data, error } = await supabase
      .from(Tables.INDICATORS)
      .select('*')
      .eq('panel_id', panelId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  async getIndicator(id: string): Promise<IndicatorWithPanel | null> {
    const { data, error } = await supabase
      .from(Tables.INDICATORS)
      .select('*, panels(id, name, category)')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return {
      ...data,
      panel: data.panels,
    }
  }

  async getIndicators(filters?: IndicatorFilters): Promise<IndicatorWithPanel[]> {
    let query = supabase
      .from(Tables.INDICATORS)
      .select('*, panels(id, name, category)')
      .order('name', { ascending: true })

    if (filters?.panelId) {
      query = query.eq('panel_id', filters.panelId)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    
    if (error) throw error
    
    return (data || []).map(indicator => ({
      ...indicator,
      panel: indicator.panels,
    }))
  }

  async searchIndicators(query: string): Promise<IndicatorWithPanel[]> {
    const { data, error } = await supabase
      .from(Tables.INDICATORS)
      .select('*, panels(id, name, category)')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(50)
    
    if (error) throw error
    
    return (data || []).map(indicator => ({
      ...indicator,
      panel: indicator.panels,
    }))
  }

  async getIndicatorCountByPanel(panelId: string): Promise<number> {
    const { count, error } = await supabase
      .from(Tables.INDICATORS)
      .select('*', { count: 'exact', head: true })
      .eq('panel_id', panelId)
    
    if (error) throw error
    return count || 0
  }
}

export const indicatorsRepository = new IndicatorsRepository()
