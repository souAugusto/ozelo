import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * Root HTML document for the web export (only applies to the /app SPA shell
 * — the marketing pages in public/ are plain static HTML with their own
 * <head>). Adds the PWA manifest, install-related meta tags for iOS/Android,
 * and registers the service worker as early as possible.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F0F14" />

        {/* iOS install support — Safari ignores the manifest for these */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ozelo" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

const responsiveBackground = `
  body { background-color: #0F0F14; }
`;
