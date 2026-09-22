import { defineMiddleware } from 'astro:middleware';

// Let reviewers preview the 404 copy as a normal workbench page.
// Unmatched URLs keep their error status.
export const onRequest = defineMiddleware(async ({ url }, next) => {
  const response = await next();
  if (url.pathname === '/404' || url.pathname === '/404/') {
    return new Response(response.body, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return response;
});
