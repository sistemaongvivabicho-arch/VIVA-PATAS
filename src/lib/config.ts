/**
 * Centralized Supabase Configuration Manager
 * Handles local persistence via localStorage for frontend public credentials,
 * falls back to Vite environment variables, and ensures NO sensitive keys are stored.
 */

import { createClient } from '@supabase/supabase-js';

export const STORAGE_KEY_URL = 'app_supabase_url';
export const STORAGE_KEY_PUBLISHABLE_KEY = 'app_supabase_publishable_key';
export const SUPABASE_CONFIG_EVENT = 'app_supabase_config_changed';

export type ConfigSource = 'localStorage' | 'env' | 'none';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  source: ConfigSource;
  isConfigured: boolean;
}

/**
 * Retrieves the effective Supabase credentials following the priority order:
 * 1. localStorage (saved by the user in the UI)
 * 2. Vite environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY/ANON_KEY)
 * 3. None (unconfigured)
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    try {
      const localUrl = localStorage.getItem(STORAGE_KEY_URL)?.trim() || '';
      const localKey = localStorage.getItem(STORAGE_KEY_PUBLISHABLE_KEY)?.trim() || '';

      if (localUrl && localKey) {
        return {
          url: localUrl,
          publishableKey: localKey,
          source: 'localStorage',
          isConfigured: true,
        };
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage:', e);
    }
  }

  // Fallback to Vite public environment variables if defined
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (envUrl && envKey) {
    return {
      url: envUrl,
      publishableKey: envKey,
      source: 'env',
      isConfigured: true,
    };
  }

  return {
    url: '',
    publishableKey: '',
    source: 'none',
    isConfigured: false,
  };
}

/**
 * Saves the public Supabase configuration exclusively to the browser's localStorage.
 * Does NOT send credentials to any remote server or backend.
 */
export function saveSupabaseConfig(url: string, publishableKey: string): void {
  if (typeof window === 'undefined') return;

  const cleanUrl = url.trim();
  const cleanKey = publishableKey.trim();

  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_PUBLISHABLE_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_PUBLISHABLE_KEY);
  }

  // Notify listeners to update active Supabase client and UI indicators
  window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_EVENT));
}

/**
 * Clears the locally stored Supabase credentials from the browser.
 */
export function clearSupabaseConfig(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_PUBLISHABLE_KEY);

  // Notify listeners
  window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_EVENT));
}

/**
 * Tests connection to the provided Supabase project without exposing tokens.
 * Returns standard success or error messages.
 */
export async function testSupabaseConnection(
  url: string,
  publishableKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = publishableKey.trim();

  if (!cleanUrl || !cleanKey) {
    return {
      success: false,
      message: 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
    };
  }

  try {
    const parsed = new URL(cleanUrl);
    if (!parsed.protocol.startsWith('http')) {
      return {
        success: false,
        message: 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
      };
    }
  } catch {
    return {
      success: false,
      message: 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
    };
  }

  try {
    // 2. Tentar criar/usar o cliente Supabase com as credenciais fornecidas
    const testClient = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 3. Realizar uma requisição simples ao Supabase para confirmar a conectividade
    // Verificamos conectividade através do cliente e requisição com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    // Teste primário via REST endpoint autenticado (retorna OpenAPI spec 200 OK quando a apikey é válida)
    const res = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 200 OK confirma que o host e a chave pública são autênticos
    if (res.ok || res.status === 200) {
      return {
        success: true,
        message: 'Conexão com o Supabase realizada com sucesso.',
      };
    }

    // Fallback: endpoint de auth/v1/settings caso a rota REST esteja protegida
    const authRes = await fetch(`${cleanUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
      },
    });

    if (authRes.ok || authRes.status === 200) {
      return {
        success: true,
        message: 'Conexão com o Supabase realizada com sucesso.',
      };
    }

    return {
      success: false,
      message: 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
    };
  }
}
