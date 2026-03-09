import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEcho = Echo<any>;

declare global {
  interface Window {
    Pusher: typeof Pusher;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Echo: Echo<any>;
  }
}

let echo: AnyEcho | null = null;
let echoToken: string | null = null;

export function getEcho(token?: string): AnyEcho {
  // Si ya existe una instancia con el mismo token, reutilizarla
  if (echo && token && echoToken === token) return echo;

  // Si el token cambió o no hay instancia, crear una nueva
  if (echo) {
    echo.disconnect();
    echo = null;
  }

  window.Pusher = Pusher;
  echoToken = token ?? null;

  echo = new Echo({
    broadcaster:       'reverb',
    key:               process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? 'helpdesk-key',
    wsHost:            process.env.NEXT_PUBLIC_REVERB_HOST ?? '127.0.0.1',
    wsPort:            Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort:           Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS:          (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint:      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    },
  });

  return echo;
}

export function disconnectEcho(): void {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
}

export function updateEchoToken(token: string): void {
  disconnectEcho();
  getEcho(token);
}
