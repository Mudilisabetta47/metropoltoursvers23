import { useState, useEffect } from 'react';

const SESSION_ID_KEY = 'metropol_session_id';

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useSessionId(): string {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    
    if (!id) {
      id = generateSessionId();
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    
    setSessionId(id);
  }, []);

  return sessionId;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  
  if (!id) {
    id = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  
  return id;
}
