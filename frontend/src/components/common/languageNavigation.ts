export function redirectToLocale(code: string, pathWithoutLocale: string) {
  window.location.href = `/${code}${pathWithoutLocale}`;
}
