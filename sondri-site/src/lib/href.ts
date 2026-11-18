/** Section anchors (#how, #faq…) live on the home page. Off it, point them
    home (`/` or `/es/`); #contact is the footer, on every page, so it stays local. */
export const sectionHref = (href: string, pathname: string, lang: 'en' | 'es' = 'en') => {
  const home = lang === 'es' ? '/es/' : '/';
  const isHome = pathname === '/' || pathname === '/es/' || pathname === '/es';
  if (href.startsWith('#') && href !== '#contact' && !isHome) return `${home}${href}`;
  return href;
};
