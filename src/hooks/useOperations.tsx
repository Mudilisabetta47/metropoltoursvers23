import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface VehiclePosition {
  id: string;
  bus_id: string;
  trip_id: string | null;
  latitude: number;
  longitude: number;
  heading: number;
  speed_kmh: number;
  status: 'on_time' | 'delayed' | 'stopped' | 'offline' | 'incident';
  delay_minutes: number;
  last_stop_id: string | null;
  next_stop_id: string | null;
  eta_next_stop: string | null;
  driver_name: string | null;
  passenger_count: number;
  updated_at: string;
}

export interface SystemStatus {
  id: string;
  service_name: string;
  status: 'online' | 'degraded' | 'offline' | 'maintenance';
  latency_ms: number;
  last_check: string;
  error_message: string | null;
}

export interface Incident {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  title: string;
  description: string | null;
  source_type: string | null;
  source_id: string | null;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeShift {
  id: string;
  user_id: string;
  shift_date: string;
  shift_start: string;
  shift_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: 'scheduled' | 'active' | 'break' | 'completed' | 'absent';
  role: 'driver' | 'scanner' | 'dispatcher' | 'support';
  assigned_bus_id: string | null;
  assigned_trip_id: string | null;
  notes: string | null;
}

export interface ScannerEvent {
  id: string;
  scanner_user_id: string;
  booking_id: string | null;
  trip_id: string | null;
  scan_type: 'check_in' | 'check_out' | 'verification';
  result: 'valid' | 'invalid' | 'expired' | 'duplicate' | 'fraud_suspected';
  ticket_number: string | null;
  created_at: string;
}

export interface OperationsKPIs {
  activeTrips: number;
  activeEmployees: number;
  checkInRate: number;
  avgDelay: number;
  activeIncidents: number;
  bookingsLastHour: number;
  scansPerMinute: number;
  validScans: number;
  invalidScans: number;
  fraudSuspected: number;
}

// Hook for System Status with Realtime
export const useSystemStatus = () => {
  const [services, setServices] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<'online' | 'degraded' | 'incident'>('online');

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('system_status')
        .select('*')
        .order('service_name');
      
      if (!error && data) {
        setServices(data as SystemStatus[]);
        calculateOverallStatus(data as SystemStatus[]);
      }
      setIsLoading(false);
    };

    fetchStatus();

    // Realtime subscription
    const channel = supabase
      .channel('system_status_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_status' },
        () => { fetchStatus(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const calculateOverallStatus = (data: SystemStatus[]) => {
    const hasOffline = data.some(s => s.status === 'offline');
    const hasDegraded = data.some(s => s.status === 'degraded');
    
    if (hasOffline) setOverallStatus('incident');
    else if (hasDegraded) setOverallStatus('degraded');
    else setOverallStatus('online');
  };

  return { services, isLoading, overallStatus };
};

// Hook for Vehicle Positions with Realtime
export const useVehiclePositions = () => {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      const { data, error } = await supabase
        .from('vehicle_positions')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (!error && data) {
        setVehicles(data as VehiclePosition[]);
      }
      setIsLoading(false);
    };

    fetchPositions();

    // Realtime subscription
    const channel = supabase
      .channel('vehicle_positions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vehicle_positions' },
        () => { fetchPositions(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { vehicles, isLoading };
};

// Hook for Incidents with Realtime
export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .neq('status', 'resolved')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setIncidents(data as Incident[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchIncidents();

    // Realtime subscription
    const channel = supabase
      .channel('incidents_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'incidents' },
        () => { fetchIncidents(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchIncidents]);

  const updateIncidentStatus = async (id: string, status: Incident['status']) => {
    const { error } = await supabase
      .from('incidents')
      .update({ 
        status, 
        resolved_at: status === 'resolved' ? new Date().toISOString() : null 
      })
      .eq('id', id);
    
    if (!error) fetchIncidents();
    return { error };
  };

  const createIncident = async (incident: Partial<Incident>) => {
    const { error } = await supabase
      .from('incidents')
      .insert(incident as never);
    
    if (!error) fetchIncidents();
    return { error };
  };

  return { incidents, isLoading, updateIncidentStatus, createIncident, refresh: fetchIncidents };
};

// Hook for Employee Shifts
export const useEmployeeShifts = () => {
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShifts = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('employee_shifts')
        .select('*')
        .eq('shift_date', today)
        .order('shift_start');
      
      if (!error && data) {
        setShifts(data as EmployeeShift[]);
      }
      setIsLoading(false);
    };

    fetchShifts();

    const channel = supabase
      .channel('employee_shifts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'employee_shifts' },
        () => { fetchShifts(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { shifts, isLoading };
};

// Hook for Scanner Events
export const useScannerEvents = (limit = 50) => {
  const [events, setEvents] = useState<ScannerEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0, fraud: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('scanner_events')
        .select('*')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!error && data) {
        setEvents(data as ScannerEvent[]);
        
        // Calculate stats
        const total = data.length;
        const valid = data.filter(e => e.result === 'valid').length;
        const invalid = data.filter(e => ['invalid', 'expired'].includes(e.result)).length;
        const fraud = data.filter(e => e.result === 'fraud_suspected').length;
        setStats({ total, valid, invalid, fraud });
      }
      setIsLoading(false);
    };

    fetchEvents();

    const channel = supabase
      .channel('scanner_events_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'scanner_events' },
        () => { fetchEvents(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { events, stats, isLoading };
};

// Hook for Operations KPIs
export const useOperationsKPIs = () => {
  const [kpis, setKPIs] = useState<OperationsKPIs>({
    activeTrips: 0,
    activeEmployees: 0,
    checkInRate: 0,
    avgDelay: 0,
    activeIncidents: 0,
    bookingsLastHour: 0,
    scansPerMinute: 0,
    validScans: 0,
    invalidScans: 0,
    fraudSuspected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const today = now.toISOString().split('T')[0];

    // Parallel queries
    const [
      tripsRes,
      shiftsRes,
      incidentsRes,
      bookingsRes,
      scansRes,
      vehiclesRes,
    ] = await Promise.all([
      supabase.from('trips').select('id', { count: 'exact' }).eq('departure_date', today).eq('is_active', true),
      supabase.from('employee_shifts').select('id', { count: 'exact' }).eq('shift_date', today).eq('status', 'active'),
      supabase.from('incidents').select('id', { count: 'exact' }).neq('status', 'resolved'),
      supabase.from('bookings').select('id', { count: 'exact' }).gte('created_at', oneHourAgo),
      supabase.from('scanner_events').select('*').gte('created_at', oneHourAgo),
      supabase.from('vehicle_positions').select('delay_minutes, status'),
    ]);

    const scans = scansRes.data || [];
    const vehicles = vehiclesRes.data || [];
    
    // Calculate averages
    const avgDelay = vehicles.length > 0 
      ? vehicles.reduce((acc, v) => acc + (v.delay_minutes || 0), 0) / vehicles.length 
      : 0;

    const validScans = scans.filter(s => s.result === 'valid').length;
    const invalidScans = scans.filter(s => ['invalid', 'expired'].includes(s.result)).length;
    const fraudSuspected = scans.filter(s => s.result === 'fraud_suspected').length;
    const checkInRate = scans.length > 0 ? Math.round((validScans / scans.length) * 100) : 100;
    const scansPerMinute = scans.length / 60;

    setKPIs({
      activeTrips: tripsRes.count || 0,
      activeEmployees: shiftsRes.count || 0,
      checkInRate,
      avgDelay: Math.round(avgDelay),
      activeIncidents: incidentsRes.count || 0,
      bookingsLastHour: bookingsRes.count || 0,
      scansPerMinute: Math.round(scansPerMinute * 10) / 10,
      validScans,
      invalidScans,
      fraudSuspected,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchKPIs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchKPIs, 30000);
    return () => clearInterval(interval);
  }, [fetchKPIs]);

  return { kpis, isLoading, refresh: fetchKPIs };
};

// Hook for Command Actions
export const useCommandActions = () => {
  const logCommand = async (
    commandType: string, 
    targetType: string | null, 
    targetId: string | null, 
    parameters: Record<string, unknown> = {}
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('command_logs')
      .insert({
        user_id: user.id,
        command_type: commandType,
        target_type: targetType,
        target_id: targetId,
        parameters,
        result: 'success',
      } as never);

    return { error };
  };

  const cancelTrip = async (tripId: string, reason: string) => {
    const { error } = await supabase
      .from('trips')
      .update({ is_active: false } as never)
      .eq('id', tripId);

    if (!error) {
      await logCommand('CANCEL_TRIP', 'trip', tripId, { reason });
    }
    return { error };
  };

  const reportDelay = async (tripId: string, delayMinutes: number) => {
    const { error } = await supabase
      .from('vehicle_positions')
      .update({ delay_minutes: delayMinutes, status: delayMinutes > 15 ? 'delayed' : 'on_time' } as never)
      .eq('trip_id', tripId);

    if (!error) {
      await logCommand('REPORT_DELAY', 'trip', tripId, { delay_minutes: delayMinutes });
    }
    return { error };
  };

  const reassignDriver = async (shiftId: string, newBusId: string) => {
    const { error } = await supabase
      .from('employee_shifts')
      .update({ assigned_bus_id: newBusId } as never)
      .eq('id', shiftId);

    if (!error) {
      await logCommand('REASSIGN_DRIVER', 'shift', shiftId, { new_bus_id: newBusId });
    }
    return { error };
  };

  return { cancelTrip, reportDelay, reassignDriver, logCommand };
};

// Hook for Audit Logs
export const useAuditLogs = (limit = 50) => {
  const [logs, setLogs] = useState<Array<{
    id: string;
    user_id: string;
    action: string;
    table_name: string;
    record_id: string | null;
    details: unknown;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!error && data) {
        setLogs(data as typeof logs);
      }
      setIsLoading(false);
    };

    fetchLogs();
  }, [limit]);

  return { logs, isLoading };
};

// Hook for Command Logs
export const useCommandLogs = (limit = 50) => {
  const [logs, setLogs] = useState<Array<{
    id: string;
    user_id: string;
    command_type: string;
    target_type: string | null;
    target_id: string | null;
    parameters: unknown;
    result: string;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('command_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!error && data) {
        setLogs(data as typeof logs);
      }
      setIsLoading(false);
    };

    fetchLogs();
  }, [limit]);

  return { logs, isLoading };
};
