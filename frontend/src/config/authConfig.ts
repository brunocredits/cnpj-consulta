import { Configuration, LogLevel } from '@azure/msal-browser'

// Configurações do MSAL para autenticação com Entra ID
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID || ''}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:
            console.error(message)
            break
          case LogLevel.Warning:
            console.warn(message)
            break
          case LogLevel.Info:
            console.info(message)
            break
          case LogLevel.Verbose:
            console.debug(message)
            break
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
}

// Scopes para requisição de token
export const loginRequest = {
  scopes: [`api://${import.meta.env.VITE_CLIENT_ID}/access_as_user`],
}

// Scope para API
export const apiRequest = {
  scopes: [`api://${import.meta.env.VITE_CLIENT_ID}/access_as_user`],
}
