/** Section anchors (#how, #faq…) live on the home page. Off it, point them
    home; #contact is the footer, on every page, so it stays local. */
export const sectionHref = (href: string, pathname: string) =>
  href.startsWith('#') && href !== '#contact' && pathname !== '/' ? `/${href}` : href;
