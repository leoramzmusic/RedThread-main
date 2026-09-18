import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html data-scroll-behavior="smooth">
      <Head>
        {/* Google Fonts URL — must include every font selectable in the admin (Apariencia > Banners) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600;700&family=Open+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=Lobster&family=Pacifico&family=Caveat:wght@500;600;700&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600&family=Montserrat:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700&family=Lato:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Prevent theme flash on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('user_theme_mode');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var mode = theme || (supportDark ? 'dark' : 'light');
                  
                  if (mode === 'dark') {
                    document.documentElement.classList.add('theme-dark');
                    document.documentElement.setAttribute('data-mode', 'dark');
                  } else {
                    document.documentElement.classList.add('theme-light');
                    document.documentElement.setAttribute('data-mode', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
