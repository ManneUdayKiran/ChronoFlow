// Google API type definitions
declare global {
  interface Window {
    gapi: {
      load: (apis: string, callback: () => void) => void;
      client: {
        init: (config: {
          apiKey: string;
          clientId: string;
          discoveryDocs: string[];
          scope: string;
        }) => Promise<void>;
        calendar: {
          events: {
            list: (params: {
              calendarId: string;
              timeMin: string;
              maxResults: number;
              singleEvents: boolean;
              orderBy: string;
            }) => Promise<{
              result: {
                items?: Array<{
                  id: string;
                  summary?: string;
                  description?: string;
                  location?: string;
                  start: {
                    dateTime?: string;
                    date?: string;
                  };
                  end: {
                    dateTime?: string;
                    date?: string;
                  };
                }>;
              };
            }>;
          };
        };
      };
      auth2: {
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
            listen: (callback: (isSignedIn: boolean) => void) => void;
          };
          signIn: () => Promise<void>;
          signOut: () => Promise<void>;
        };
      };
    };
  }
}

export {};
