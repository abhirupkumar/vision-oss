export default {
  async fetch(request, env) {
    try {
      const response = await env.ASSETS.fetch(request);
      
      if (response.status === 404) {
        const indexUrl = new URL('/', request.url);
        return await env.ASSETS.fetch(new Request(indexUrl));
      }
      
      return response;
    } catch (e) {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
