# How the Web Works

> Stage: 1 · Foundations
> Before writing a line of code, understand the system you're building for: what happens between typing a URL and seeing a page.

## The request lifecycle

- [ ] Client–server model - explain what a browser, a server, and a request/response pair are
- [ ] URLs - name every part: scheme, host, port, path, query string, fragment
- [ ] DNS - describe how a domain name resolves to an IP address, and what a TTL is
- [ ] TCP and TLS - know that a connection and an encrypted handshake happen before any HTTP is sent
- [ ] URL to pixels - narrate the full journey: DNS, connection, request, response, parse, render

## HTTP

- [ ] Methods - use `GET`, `POST`, `PUT`, `PATCH`, `DELETE` correctly; know which are safe and idempotent
- [ ] Status codes - recognise the families (2xx, 3xx, 4xx, 5xx) and the common ones: 200, 201, 204, 301, 302, 304, 307, 308, 400, 401, 403, 404, 429, 500, 503
- [ ] Headers - read request and response headers; know `Content-Type`, `Accept`, `Authorization`, `Cache-Control`, `Set-Cookie`
- [ ] Request and response bodies - tell JSON, form-encoded, and multipart payloads apart
- [ ] Cookies - explain how a stateless protocol gets sessions
- [ ] Origins - define an origin (scheme, host, port) and why the browser treats each one as a separate security boundary
- [ ] HTTP caching basics - `Cache-Control`, `ETag`, and how a 304 revalidation saves a download
- [ ] HTTPS - explain what HTTPS guarantees (encryption, integrity, server identity) and what it doesn't
- [ ] HTTP/1.1 vs HTTP/2 vs HTTP/3 - know the headline differences: multiplexing, header compression, QUIC

## The platform

- [ ] Browsers and engines - know Blink, WebKit, and Gecko, and why engine diversity matters
- [ ] Web standards - know who W3C, WHATWG, and TC39 are and how features get standardised
- [ ] Hosting basics - explain static hosting, an origin server, and a CDN
- [ ] Domains - register a domain and point DNS records (A, CNAME) at a host

## Practice

- [ ] Inspect a real page load - open the DevTools Network panel on a site you use and explain every column
- [ ] Make raw requests - use `curl -v` to fetch a page and read the headers
- [ ] Ship something - put a single HTML file on the public internet

## Resources

- [MDN: How the web works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works)
- [MDN: An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [How DNS works (comic)](https://howdns.works/)
