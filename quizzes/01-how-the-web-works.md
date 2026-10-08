# How the Web Works: Practice test

### 1. In the client–server model, which statement is true of plain HTTP?

- [ ] The server can send a response at any time, whether or not a request was made
- [x] The client always initiates; the server sends one response per request
- [ ] The server remembers earlier requests on the same connection and uses them to interpret later ones
- [ ] A page load is a single request that returns the HTML, CSS, and images together

> HTTP is request/response and stateless: the client speaks first and each request is interpreted on its own. A page load is many requests, one per resource. Anything that looks like the server pushing is layered on a connection the client opened.

### 2. Which part of this URL is never sent to the server?

```text
https://shop.example.com:8443/products/shoes?color=red#reviews
```

- [ ] `:8443`
- [ ] `?color=red`
- [ ] `/products/shoes`
- [x] `#reviews`

> The fragment is used only by the browser (to scroll to an element or for client-side routing). The port determines where the connection goes, and the path and query form the request target.

### 3. What does this log?

```js
const url = new URL('https://example.com/search');
url.searchParams.set('q', 'a&b c');
console.log(url.search);
```

- [ ] `?q=a&b c`
- [ ] `?q=a&b%20c`
- [x] `?q=a%26b+c`
- [ ] `?q=a%26b c`

> `URLSearchParams` serialises using form-encoding rules: `&` inside a value must become `%26` or it would start a new parameter, and a space becomes `+`. Building the string by hand (`'?q=' + value`) would produce the first option and silently create a second parameter named `b c`.

### 4. You change an A record whose TTL is 86400. An hour later some visitors still reach the old server. Why?

- [ ] DNS changes must be approved by the root servers, which takes up to a day
- [ ] The registrar only publishes changes once every 24 hours
- [x] Resolvers that cached the old answer may keep using it until its TTL of one day expires
- [ ] Browsers ignore TTLs and cache DNS answers until restarted

> The authoritative server has the new record immediately. Recursive resolvers (and OS and browser caches) that fetched the old one are entitled to reuse it for the TTL. Lowering the TTL well before the change is how you make a cutover fast.

### 5. For a first visit to an `https://` URL over HTTP/2, what is the correct order of events?

- [ ] TLS handshake, DNS lookup, TCP handshake, HTTP request
- [ ] DNS lookup, HTTP request, TCP handshake, TLS handshake
- [ ] TCP handshake, DNS lookup, TLS handshake, HTTP request
- [x] DNS lookup, TCP handshake, TLS handshake, HTTP request

> The browser needs an IP address before it can connect, a TCP connection before TLS can run on top of it, and an encrypted channel before it sends any HTTP. Each step costs at least one round trip, which is why connection reuse matters.

### 6. Which request is safe to retry automatically after a network timeout, with no risk of doing the work twice?

- [x] `PUT /users/7` with the full user object
- [ ] `POST /orders` with a new order
- [ ] `POST /users/7/send-reminder`
- [ ] `PATCH /counter` with `{"op":"increment"}`

> `PUT` is idempotent: replacing the resource with the same representation twice leaves the same state. `POST` is not idempotent, and a `PATCH` that expresses a relative change such as an increment is not either.

### 7. A logged-in user requests a page they do not have permission to see. Which status code fits best?

- [ ] 401 Unauthorized
- [x] 403 Forbidden
- [ ] 400 Bad Request
- [ ] 404 Not Found, always

> 401 means "not authenticated": credentials are missing or invalid, and logging in could help. 403 means the server knows who you are and refuses. Returning 404 to hide the resource's existence is a legitimate deliberate choice, but it is not what the code is for by default.

### 8. What does this print when the server responds with `404 Not Found` and a JSON error body?

```js
try {
  const res = await fetch('/api/users/999');
  console.log('A', res.ok);
} catch (err) {
  console.log('B');
}
```

- [ ] `B`
- [ ] `A true`
- [x] `A false`
- [ ] Nothing; the promise never settles

> `fetch()` rejects only when no response is obtained (network failure, CORS block, abort). A 404 is a complete HTTP response, so the promise resolves and `res.ok` is `false` because the status is outside 200–299.

### 9. A response has `Cache-Control: no-cache`. What may the browser do?

- [ ] It must not store the response anywhere
- [ ] It may reuse the stored response for the rest of the session without contacting the server
- [ ] It may store the response only in memory, not on disk
- [x] It may store the response but must revalidate with the server before each reuse

> `no-cache` allows storage and requires revalidation (typically a conditional request that returns 304 if unchanged). `no-store` is the directive that forbids storing.

### 10. This upload fails on the server with "no multipart boundary found". What is the bug?

```js
const data = new FormData();
data.append('avatar', fileInput.files[0]);

await fetch('/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' },
  body: data,
});
```

- [ ] `FormData` cannot hold files; the file must be base64-encoded first
- [x] Setting `Content-Type` by hand omits the `boundary` parameter; the header should be left for the browser to set
- [ ] The method should be `PUT` for file uploads
- [ ] The body must be `JSON.stringify(data)`

> A multipart body is split by a boundary string that must be declared in the header: `multipart/form-data; boundary=…`. When you pass `FormData` and no `Content-Type`, the browser generates both. Overriding the header removes the boundary.

### 11. Which cookie attribute prevents injected JavaScript from reading a session cookie?

```http
Set-Cookie: sid=k3J9xQ; Path=/; Secure; HttpOnly; SameSite=Lax
```

- [ ] `Secure`
- [ ] `SameSite=Lax`
- [x] `HttpOnly`
- [ ] `Path=/`

> `HttpOnly` hides the cookie from `document.cookie`; it is still sent on requests. `Secure` restricts it to HTTPS, and `SameSite` controls whether it is attached to cross-site requests (a CSRF defence), neither of which stops script on the page from reading it.

### 12. A page is served from `https://app.example.com`. Which of these URLs has the same origin?

- [ ] `https://example.com/dashboard`
- [ ] `http://app.example.com/dashboard`
- [ ] `https://app.example.com:8443/dashboard`
- [x] `https://app.example.com/settings?tab=profile#billing`

> An origin is scheme, host, and port, all of which must match exactly. Path, query, and fragment are not part of it. The parent domain is a different host, `http` is a different scheme, and 8443 differs from the default port 443. (The first option is cross-origin but same-*site*, which is the boundary cookies use.)

### 13. A browser has a stale cached copy of `/logo.svg` with `ETag: "v7"`. It revalidates and the file has not changed. What is exchanged?

- [ ] Nothing; the browser reuses the copy without contacting the server
- [ ] A `GET` request, answered with `200 OK` and the full file again
- [x] A `GET` request with `If-None-Match: "v7"`, answered with `304 Not Modified` and no body
- [ ] A `HEAD` request, answered with `204 No Content`

> A stale copy cannot be reused without checking. The browser sends a conditional request carrying the validator; the server compares it and, if it still matches, returns 304 with headers only, so the browser pays a round trip but not the download. No contact at all happens only while the copy is still fresh.

### 14. A site shows a valid HTTPS connection. Which claim is justified?

- [ ] The organisation running the site has been vetted as legitimate
- [ ] Nobody on the network can tell which site you are visiting
- [ ] The server stores your data securely
- [x] Data in transit cannot be read or modified by others on the network, and the server controls a certificate for that domain

> TLS gives confidentiality and integrity in transit and authenticates the domain. A phishing site can have a valid certificate, observers still see the IP address and usually the hostname, and nothing is implied about what the server does with the data.

### 15. What is the main problem HTTP/2 multiplexing solves compared with HTTP/1.1?

- [ ] It removes the need for TLS
- [x] Many requests can be in flight on one connection at once instead of queueing behind each other
- [ ] It makes responses smaller by changing the status codes and methods
- [ ] It removes the TCP handshake

> In HTTP/1.1 a connection carries one request at a time, so browsers open several connections and requests still queue. HTTP/2 interleaves streams on one connection. Semantics (methods, status codes) are unchanged, and it still runs over TCP and, in browsers, TLS.

### 16. What does HTTP/3 fix that HTTP/2 could not?

- [ ] Header compression, which HTTP/2 lacks
- [ ] Support for more than six concurrent requests
- [x] A lost packet stalling every stream, because HTTP/2's streams share one ordered TCP byte stream
- [ ] The inability to use HTTPS

> HTTP/2 already multiplexes and compresses headers (HPACK), but TCP delivers bytes strictly in order, so one lost packet blocks all streams until it is resent. QUIC gives each stream independent delivery, and also merges the transport and TLS handshakes.

### 17. Your site works in Chrome, Edge, and Brave on desktop. What have you established?

- [ ] It works in all major browsers
- [ ] It works on iPhones, because Chrome is available on iOS
- [ ] It works in three independent engines
- [x] It works in one engine, Blink; Gecko and WebKit are untested

> Chrome, Edge, and Brave all use Blink. Firefox uses Gecko and Safari uses WebKit, and browsers on iOS are WebKit underneath for nearly all users, including Chrome for iOS.

### 18. You want `example.com` (no `www`) to point at `mysite.hostingco.net`. Why can you not simply add a CNAME record at the apex?

- [x] A CNAME cannot coexist with other records on the same name, and the apex must have NS and SOA records
- [ ] CNAME records only work for names beginning with `www`
- [ ] CNAME records cannot point to a domain under a different TLD
- [ ] The apex can only hold AAAA records

> A CNAME says "this name is entirely an alias of that one", so no other record types may sit beside it, and the zone apex always has NS and SOA. The fix is A/AAAA records with the host's addresses, or the DNS provider's ALIAS/ANAME/CNAME-flattening feature.

### 19. In the DevTools Network panel, a script shows `(disk cache)` in the Size column and a Time of 2 ms. What happened?

- [ ] The request was blocked by the browser
- [ ] The server answered with 304 Not Modified
- [x] The browser reused a fresh stored copy without contacting the server at all
- [ ] The file was empty

> A cache hit on a fresh response involves no network request. A 304 is different: the browser did contact the server with a conditional request, the Status column shows 304, and the Size column shows the small size of the headers that were transferred.

### 20. In `curl -v` output, what do lines beginning with `>` contain?

```text
* Connected to example.com (93.184.215.14) port 443
> GET / HTTP/2
> Host: example.com
< HTTP/2 200
< content-type: text/html; charset=UTF-8
```

- [ ] Response headers from the server
- [ ] curl's own commentary about the connection
- [x] The request line and headers that curl sent
- [ ] The response body

> `>` is what the client sent, `<` is what the server returned, and `*` is curl narrating DNS, connection, and TLS. The body appears without a prefix.

### 21. Explain the difference between a 301 and a 302 redirect, and why you might test with a 302 before switching to a 301.

> Both tell the client to request a different URL given in `Location`. 301 says the move is permanent: browsers cache it (often for a long time, without re-asking the server) and search engines transfer ranking to the new URL. 302 says it is temporary: the client should keep using the original URL in future. Because a 301 is cached in users' browsers, a mistaken one is hard to undo: visitors who received it will keep following it even after you fix the server. Testing with 302 lets you confirm the behaviour, then make it permanent. If the request method must be preserved (for example redirecting a `POST`), use 307 and 308, the temporary and permanent equivalents that forbid changing the method to `GET`.

### 22. HTTP is stateless. Describe step by step how a site keeps you logged in.

> 1. You submit credentials in a `POST` to the login endpoint.
> 2. The server verifies them, creates a session record (for example in a database or cache) keyed by a long random identifier, and responds with `Set-Cookie: sid=<identifier>; Secure; HttpOnly; SameSite=Lax; Path=/`.
> 3. The browser stores the cookie and automatically adds `Cookie: sid=<identifier>` to every later request to that site.
> 4. On each request the server looks up the identifier, finds the session, and treats the request as coming from that user.
> 5. Logging out deletes the server-side session and clears the cookie.
>
> The protocol itself still remembers nothing; the state is carried by the client on each request. The identifier is a bearer credential, so it needs `Secure` (never sent in plain text), `HttpOnly` (not readable by script), and `SameSite` (not attached to cross-site requests, which limits CSRF).

### 23. Narrate what happens between pressing Enter on `https://example.com/` and seeing the page, for a first visit.

> The browser parses the input as a URL and checks its caches (HSTS list, service worker, HTTP cache). It resolves `example.com` through DNS: browser and OS caches, then a recursive resolver, which if necessary asks root, TLD, and authoritative servers and returns an IP address with a TTL. The browser opens a TCP connection to that address on port 443 (one round trip), then performs a TLS handshake in which the server presents a certificate for the hostname, the browser validates it, and both derive session keys; ALPN selects HTTP/2. (With HTTP/3, QUIC combines these handshakes.) The browser sends `GET /` with headers such as `Host`, `Accept`, and any cookies. The server responds with a status, headers, and the HTML body, usually compressed. The browser parses the HTML as it streams in, building the DOM, and requests the subresources it discovers: CSS, scripts, images, fonts. CSS is parsed into the CSSOM and blocks rendering; classic scripts without `defer`/`async` block parsing. Once it has the DOM and CSSOM, the browser computes styles, runs layout, paints, and composites the result to the screen, then repeats those steps as more content, images, and fonts arrive.

### 24. A teammate proposes a "Delete account" link implemented as `<a href="/account/delete?id=42">`. Explain what is wrong.

> A link issues a `GET`, and `GET` is defined as safe: clients are allowed to assume it changes nothing. Browsers may prefetch or prerender links, crawlers follow them, link scanners in email and chat clients open them, and the URL sits in history and logs where it can be replayed. Any of these would delete the account. It is also a CSRF risk: another site can simply link to that URL, and a top-level navigation by `GET` carries the user's cookies even under `SameSite=Lax`, because `Lax` assumes `GET` is safe. A destructive action should be a `POST` or `DELETE` (from a form or `fetch`), protected by `SameSite` cookies and a CSRF token, and ideally require confirmation.

### 25. You deployed a new `app.js`, but some users still run the old one. The response headers are below. Explain the cause and the standard fix.

```http
HTTP/2 200
content-type: text/javascript
cache-control: public, max-age=2592000
```

> `max-age=2592000` tells browsers and CDNs the file is fresh for 30 days, so anyone who already has it will not ask the server again until then; the new deploy is invisible to them. You cannot reach into their caches. The standard fix is to make the URL change when the content changes: put a content hash in the file name (`app.3f9a1c.js`), serve those files with a long lifetime (`max-age=31536000, immutable`), and serve the HTML that references them with `Cache-Control: no-cache` so it is revalidated on every visit and always points to the current file names. Build tools do the hashing for you. For the already-affected file, you can purge the CDN, but browsers that cached it will keep it until it expires unless the HTML starts pointing to a new URL.

### 26. In the Network panel's Timing tab, a request shows a long "Waiting for server response" and a short "Content Download". Another shows the opposite. What does each tell you, and where would you look to fix it?

> "Waiting for server response" is time to first byte: the time from sending the request until the first byte of the response arrives. It covers one network round trip plus however long the server took to produce the response. A long value points at the server or the distance to it: slow application code or database queries, a cold start, no CDN caching, or a far-away origin. You fix it with server-side work, caching, or serving from the edge. "Content Download" is the time to receive the body after the first byte. A long value there means a large response or a slow connection: fix it by sending fewer bytes (compression, smaller images, code splitting) rather than by touching the server's logic.

### 27. Why can putting a site behind a CDN speed it up even for requests that are not cached?

> The connection setup happens between the visitor and a nearby edge location rather than a distant origin, so the round trips for the TCP and TLS handshakes (or the QUIC handshake) are short. The CDN keeps warm, long-lived connections to the origin and reuses them, so the visitor does not pay for a fresh long-distance handshake. CDNs also usually provide HTTP/2 and HTTP/3, modern TLS, and compression even if the origin does not, and route traffic over well-provisioned paths. Cached responses then avoid the origin entirely, which is the bigger win when it applies.

### 28. Your front end at `http://localhost:5173` calls `fetch('http://localhost:3000/api/items')` and the Console shows a CORS error, yet the same URL works with `curl` and when opened directly in a tab. Explain what is happening and how to fix it.

> The two URLs differ in port, so they are different origins. The same-origin policy lets a page *send* a cross-origin request but does not let its script *read* the response unless the server opts in. The API did receive the request and did respond (the Network panel shows it); the browser then withheld the response from JavaScript because it carried no `Access-Control-Allow-Origin` header naming the page's origin. `curl` is not a browser and enforces no such policy, and typing the URL into a tab is a navigation, not a script reading another origin's data, so neither is affected.
>
> The fix belongs on the server or in the setup, not in the fetch call: have the API send `Access-Control-Allow-Origin: http://localhost:5173` (and answer the `OPTIONS` preflight for non-simple requests, plus `Access-Control-Allow-Credentials: true` if cookies are needed), or avoid the cross-origin request entirely by proxying `/api` through the dev server so that page and API share an origin. `mode: 'no-cors'` is not a fix: it yields an opaque response the script still cannot read.
