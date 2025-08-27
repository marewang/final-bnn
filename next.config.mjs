// next.config.mjs
const csp = `
default-src 'self';
connect-src 'self' https://*.vercel-insights.com;
img-src 'self' data: blob:;
script-src 'self' 'unsafe-inline' 'unsafe-eval' vercel.live;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
frame-ancestors 'self';
form-action 'self';
`.replace(/\n/g, ' ');

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

