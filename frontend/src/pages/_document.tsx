import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
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
