# How the Web Works: Guide

## Toolkit

### DevTools and tooling

The **Network panel** is the main instrument for this module. Open DevTools (F12, or Ctrl+Shift+I / Cmd+Option+I), switch to Network, then reload: the panel only records while it is open. Tick **Disable cache** to see a cold load and **Preserve log** to keep entries across navigations and redirects. Right-click the column header row to add **Protocol**, **Domain**, **Remote Address**, **Priority**, and **Connection ID**; these turn the table from a file list into a picture of what the network actually did. Click any row for the **Headers**, **Payload**, **Response**, **Cookies**, and **Timing** tabs. Firefox's Network Monitor shows the same data and has a handy **Edit and Resend**; Safari's Web Inspector matters when you debug iOS.

The **Application panel** (Storage tab in Firefox) lists cookies per origin with every attribute, and lets you edit or delete them.

On the command line:

- `curl -v https://example.com` prints DNS, connection, TLS, and both sets of headers. `curl -I` fetches headers only; `-L` follows redirects.
- `dig example.com A +noall +answer` (macOS, Linux, WSL) or `nslookup example.com` and PowerShell's `Resolve-DnsName example.com` (Windows) query DNS directly.
- `openssl s_client -connect example.com:443 -servername example.com` shows the certificate chain and negotiated TLS version.

In the browser, clicking the icon at the left of the address bar shows connection and certificate details, and Chrome's `chrome://net-internals/#dns` lets you clear the browser's own DNS cache. For API work, a request client such as Bruno, Hoppscotch, or the REST Client extension for VS Code saves you from retyping `curl` flags, but learn `curl` first: it is on every server you will ever SSH into.

### Testing and verifying your work

Work in this module is "correct" when what the network does matches what you intended, so you verify by observing rather than assuming.

- **Check the response from outside the browser.** `curl -sI https://your-site.example/` shows the status line and headers without cache, extensions, or service workers in the way. Confirm the status code, `Content-Type` (with `charset=utf-8` for text), and `Cache-Control`.
- **Check redirects end to end.** `curl -sIL http://your-site.example/` should show `http` redirecting to `https` with a 301 or 308, and `www` and the bare domain converging on one canonical host in as few hops as possible.
- **Check DNS at the source.** Query the authoritative nameserver directly (`dig @ns1.yourdns.example your-site.example`) to see the record you set without waiting for caches, then query a public resolver (`dig @1.1.1.1 …`) to see what the world sees.
- **Check TLS.** The certificate must cover every hostname you serve, and there must be no mixed-content warnings in the Console. Qualys SSL Labs gives a full report on a public host.
- **Check caching.** Reload normally (not hard reload) and look for `304` responses or `(disk cache)` in the Size column on assets you expect to be cached; HTML should usually revalidate.
- **Check a cold, slow load.** Disable cache, set throttling to a slower profile, and read the waterfall: is anything blocking the first render that does not need to?

You are done when you can explain every row in the waterfall for your page and none of them surprises you.

### Tricks and gotchas

- In Windows PowerShell 5.1, `curl` is an alias for `Invoke-WebRequest`. Type `curl.exe` to get real curl. PowerShell 7 and Git Bash do not have this problem.
- "DNS propagation" is mostly cache expiry. Lower a record's TTL a day *before* you change it, and the change takes effect in minutes rather than hours.
- A hard reload (Ctrl+Shift+R) bypasses the HTTP cache; a normal reload revalidates. If you only ever hard-reload, you never see what returning visitors see.
- An HTTP error is still a successful response as far as the network is concerned. `fetch()` resolves on 404 and 500; check `response.ok`.
- `no-cache` does not mean "do not cache". It means "store it, but revalidate before each use". `no-store` is the one that forbids storing.
- A 301 is cached by browsers, sometimes for a very long time. Test a redirect as a 302 first and switch to a permanent one when you are sure.
- Header names are case-insensitive, and HTTP/2 and HTTP/3 send them in lowercase. Never write code that depends on `Content-Type` versus `content-type`.
- Right-click a request in the Network panel and choose **Copy > Copy as cURL** to replay exactly what the browser sent, cookies and all. Treat the result as a secret.
- `localhost` is treated as a secure context, so APIs that require HTTPS work in development without a certificate.
- The fragment (`#section`) never leaves the browser. You will not find it in server logs.
- Add the **Protocol** column and look for `h2` or `h3`. If you see `http/1.1` on a production site, something between you and the server is downgrading.

### Official references

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — the practical reference for methods, status codes, headers, caching, and cookies.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) — the normative definition of methods, status codes, and header fields, shared by all HTTP versions.
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html) — the rules behind `Cache-Control`, freshness, and validation.
- [WHATWG URL Standard](https://url.spec.whatwg.org/) — how browsers parse and serialise URLs.
- [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/) — how browsers make requests, including CORS and credentials.
- [Chrome DevTools: Network features reference](https://developer.chrome.com/docs/devtools/network/reference) — every control and column in the Network panel.
- [curl man page](https://curl.se/docs/manpage.html) — every flag, with examples.
- [web.dev: Baseline](https://web.dev/baseline) — how to tell whether a web platform feature is safe to use across browsers.
- [High Performance Browser Networking](https://hpbn.co/) — Ilya Grigorik's free book on TCP, TLS, and HTTP from a browser's point of view; older, but the fundamentals have not changed.

## Skills

### Client–server model

The web is a conversation where one side always speaks first. A **client** (usually a browser, but also `curl`, a mobile app, or another server) opens a connection and sends a **request**; a **server** is a program listening on a port that sends back exactly one **response** to each request. The server never initiates. Everything that feels like the server "pushing" (notifications, live updates) is built on top of a connection the client opened first, such as a WebSocket or a long-lived streaming response.

"Server" means the software (nginx, a Node process) as much as the machine it runs on, and one page load involves many servers: the one for the HTML, others for fonts, analytics, images, and APIs. Each request/response pair is independent. HTTP is **stateless**: the server does not inherently remember that the request for `/cart` came from the same person as the request for `/login` a second ago. Anything that looks like memory is carried explicitly, usually in a cookie.

A request is a method, a target, headers, and an optional body. A response is a status code, headers, and an optional body:

```http
GET /index.html HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!doctype html>…
```

A common beginner mistake is to picture "the website" as one file that gets downloaded. The HTML is one response; the browser then discovers and requests every stylesheet, script, and image it references.

**Try it:** Open DevTools, go to the Network panel, and load `https://example.com`. Then load a news site. Count the requests and the distinct domains for each (add the Domain column). Click the first row on each and find the request line, the status, and the response body.

**Resources**
- [MDN: How the web works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works)
- [MDN: An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)

### URLs

A URL is an address with a fixed grammar. Take this one apart:

```text
https://user:pw@shop.example.com:8443/products/shoes?color=red&size=42#reviews
```

- **Scheme** `https`: which protocol to use. It also decides the default port (443 for `https`, 80 for `http`).
- **Userinfo** `user:pw@`: legal but deprecated; browsers hide or strip it. Never put credentials here.
- **Host** `shop.example.com`: a domain name or IP address. Hostnames are case-insensitive.
- **Port** `8443`: omitted when it is the scheme's default.
- **Path** `/products/shoes`: case-sensitive on most servers; what it maps to is entirely up to the server.
- **Query** `?color=red&size=42`: key/value pairs by convention. Order and repeats are allowed (`?tag=a&tag=b`).
- **Fragment** `#reviews`: handled by the browser only. It is never sent to the server.

Scheme, host, and port together form the **origin**, which has its own entry below.

Characters outside a small safe set must be **percent-encoded**: a space becomes `%20`, and `&` inside a value becomes `%26`. The classic bug is building URLs by string concatenation and forgetting to encode. Let the platform do it:

```js
const url = new URL('/search', 'https://example.com');
url.searchParams.set('q', 'fish & chips');
url.href; // "https://example.com/search?q=fish+%26+chips"
```

Relative URLs (`../img/a.png`, `/about`, `?page=2`, `//cdn.example.com/x.js`) resolve against the current document's URL, or the `<base>` element if there is one.

**Try it:** In the Console, run `new URL(location.href)` on a page with a long URL and expand the object. Match `protocol`, `hostname`, `port`, `pathname`, `search`, `hash`, and `origin` to what you see in the address bar. Then run `new URL('../a?b=1#c', location.href).href` and predict the result first.

**Resources**
- [MDN: What is a URL?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)
- [MDN: URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)

### DNS

Computers connect to IP addresses, not names. DNS is the distributed lookup that turns `www.example.com` into something like `93.184.215.14` (an **A** record, IPv4) or `2606:2800:21f:cb07::1` (an **AAAA** record, IPv6).

Your machine asks a **recursive resolver** (run by your ISP, or a public one such as `1.1.1.1` or `8.8.8.8`). If the resolver has no cached answer, it walks the hierarchy from the right-hand side of the name:

1. A **root** server says who runs `.com`.
2. The **TLD** server for `.com` says which nameservers are authoritative for `example.com`.
3. The **authoritative** nameserver gives the actual record for `www.example.com`.

Every answer carries a **TTL** (time to live) in seconds. Each cache along the way (browser, operating system, resolver) may reuse the answer for that long without asking again. This is why DNS is fast most of the time, and why a change you make is not seen everywhere at once: caches that fetched the old answer keep it until their TTL runs out. A long TTL (a day) means fewer lookups and slower changes; a short one (five minutes) means the opposite.

A name can also be a **CNAME**, an alias that says "look up this other name instead", which costs the resolver another step. Lookups traditionally travel unencrypted over UDP port 53; browsers increasingly use DNS over HTTPS so the network cannot read or tamper with them.

A DNS lookup only happens for hosts not already cached, but each new hostname on a page can add tens of milliseconds to its first request.

**Try it:** Run `dig www.github.com` (or `nslookup www.github.com` / `Resolve-DnsName www.github.com` on Windows). Find the record type, the address, and the TTL. Run it again a few seconds later and watch the TTL count down: you are seeing your resolver's cache. Then try `dig +trace example.com` to watch the root, TLD, authoritative walk.

**Resources**
- [How DNS works (comic)](https://howdns.works/)
- [MDN: What is a domain name? (how a DNS request works)](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name)
- [MDN: DNS (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/DNS)

### TCP and TLS

HTTP needs a reliable channel underneath it. For HTTP/1.1 and HTTP/2 that channel is **TCP**, which turns the internet's lossy packet delivery into an ordered, complete byte stream. Opening a TCP connection takes a three-step handshake (SYN, SYN-ACK, ACK): one full round trip to the server before any data moves.

For `https` URLs, a **TLS** handshake comes next. The client sends a ClientHello containing the hostname it wants (SNI) and the protocols it speaks (ALPN, which is how HTTP/2 gets selected). The server replies with its certificate and key-exchange material. The client verifies that the certificate is valid for the hostname, unexpired, and chains to a certificate authority it trusts; both sides then derive shared symmetric keys. With TLS 1.3 this costs one more round trip; TLS 1.2 needed two. Only then is the first HTTP request sent.

So a cold HTTPS request costs roughly: DNS lookup, plus one round trip for TCP, plus one for TLS, plus one for the request itself. On a mobile connection with 150 ms round trips, that is close to half a second before the first byte of HTML. This is why:

- Connections are kept open and reused (**keep-alive**) for later requests.
- Every extra third-party hostname has a real setup cost.
- `<link rel="preconnect" href="https://cdn.example.com">` lets the browser do this work early for a host it will need.
- HTTP/3 replaces TCP + TLS with QUIC, which combines both handshakes into one round trip.

**Try it:** Run `curl -v https://example.com -o /dev/null` (use `-o NUL` in cmd). Lines starting with `*` narrate the connection: find the IP it connected to, the ALPN result, the TLS version, and the certificate's subject and expiry. Then, in DevTools Network, click the document request, open **Timing**, and find "Initial connection" and "SSL". Reload and notice they vanish when the connection is reused.

**Resources**
- [MDN: Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security)
- [High Performance Browser Networking: Transport Layer Security](https://hpbn.co/transport-layer-security-tls/)
- [High Performance Browser Networking: Building blocks of TCP](https://hpbn.co/building-blocks-of-tcp/)

### URL to pixels

This is the story you should be able to tell end to end, because nearly every performance and debugging question is about one step of it.

1. **Parse the URL.** The browser decides whether you typed a URL or a search, applies HSTS (upgrade to `https`), and checks whether a service worker or the HTTP cache can answer without the network.
2. **DNS.** Resolve the host to an IP address, unless cached.
3. **Connect.** TCP handshake, then TLS handshake (or QUIC, which does both), unless an open connection can be reused.
4. **Request.** Send `GET /path` with headers: `Host`, `Accept`, `User-Agent`, cookies for that site.
5. **Response.** The server returns a status, headers, and a body. A 3xx sends the browser back to step 1 with a new URL.
6. **Parse.** The HTML arrives as a stream and is parsed incrementally into the **DOM**. A preload scanner looks ahead for resources to fetch early. CSS is parsed into the **CSSOM**. A classic `<script>` without `defer` or `async` pauses the parser until it has downloaded and run.
7. **Render.** DOM plus CSSOM give the set of things to draw. The browser computes **style**, then **layout** (geometry), then **paint** (draw commands), then **composites** layers on the GPU into the frame you see.

Two details people miss. First, rendering is not a final step: the browser paints progressively as HTML streams in, but it will not paint anything until the CSS in the `<head>` has loaded, because CSS is render-blocking. Second, the page keeps changing after the first paint: late images, fonts, and script-driven DOM updates each trigger more style, layout, and paint work.

**Try it:** In DevTools, open the **Performance** panel, click the reload-and-record button on a simple site, and find, in order: the network request for the document, "Parse HTML", "Recalculate style", "Layout", "Paint", and the First Contentful Paint marker. Then narrate the seven steps aloud without notes, as you would in an interview.

**Resources**
- [MDN: Populating the page: how browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work)
- [Chrome for Developers: Inside look at modern web browser, part 2 (navigation)](https://developer.chrome.com/blog/inside-browser-part2)
- [web.dev: Understand the critical path](https://web.dev/learn/performance/understanding-the-critical-path)

### Methods

The method tells the server what kind of operation the request is. Two properties matter more than the names:

- **Safe**: the request does not ask to change server state. Crawlers, prefetchers, and link previews assume they may send safe requests freely.
- **Idempotent**: sending the request twice has the same effect as sending it once. Clients and proxies may automatically retry idempotent requests after a network failure.

| Method | Use | Safe | Idempotent |
| --- | --- | --- | --- |
| `GET` | Read a resource | Yes | Yes |
| `HEAD` | `GET` without the body | Yes | Yes |
| `POST` | Create, or trigger an action | No | No |
| `PUT` | Replace the resource at this URL | No | Yes |
| `PATCH` | Partially update | No | Not necessarily |
| `DELETE` | Remove | No | Yes |

`PUT /users/7` with a full user object is idempotent because repeating it leaves the same state. `POST /users` is not: repeat it and you may have two users. This is exactly why browsers ask "resubmit the form?" when you reload after a `POST`, and why payment APIs add idempotency keys.

Mistakes to avoid:

- Changing state on `GET` (`GET /logout`, `GET /delete?id=3`). A prefetcher or a crawler will trigger it.
- Sending a body with `GET`. It has no defined meaning and intermediaries may drop it.
- Believing `POST` is "more secure" than `GET`. Without TLS both are plain text; the real difference is that query strings end up in logs, history, and `Referer` headers.

HTML forms can only send `GET` and `POST`; the others need `fetch()`. `OPTIONS` is the method browsers use for CORS preflight requests.

**Try it:** Use `curl` against `https://httpbin.org`: `curl -X PUT https://httpbin.org/put -H "Content-Type: application/json" -d '{"a":1}'`, then try `curl -X PUT https://httpbin.org/get` and explain the status code you get back. Check the `Allow` header in that response.

**Resources**
- [MDN: HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods)
- [RFC 9110: Methods](https://www.rfc-editor.org/rfc/rfc9110.html#name-methods)

### Status codes

The first digit tells you whose move it is. **2xx**: it worked. **3xx**: look elsewhere, or use what you have. **4xx**: the request is wrong; do not repeat it unchanged. **5xx**: the server failed; the same request might work later.

- **200 OK**: success with a body.
- **201 Created**: a resource was created; `Location` should point to it.
- **204 No Content**: success, deliberately no body. Calling `response.json()` on it throws.
- **301 Moved Permanently** / **302 Found**: redirects, permanent and temporary. For historical reasons clients may change `POST` to `GET` when following them; **308** and **307** are the equivalents that preserve the method.
- **304 Not Modified**: the answer to a conditional request (`If-None-Match` with an `ETag`). No body; the browser reuses its cached copy.
- **400 Bad Request**: malformed or invalid input.
- **401 Unauthorized**: really "unauthenticated". You have not proved who you are.
- **403 Forbidden**: the server knows who you are and the answer is no. Logging in again will not help.
- **404 Not Found**: nothing at this URL.
- **429 Too Many Requests**: rate limited; honour `Retry-After`.
- **500 Internal Server Error**: an unhandled failure in the server.
- **503 Service Unavailable**: overloaded or down for maintenance; often with `Retry-After`.

Also worth recognising: **405** (method not allowed), **409** (conflict), **422** (well-formed but semantically invalid), **502** and **504** (a proxy could not get a good answer from the server behind it).

The frequent mistakes are on the server side: returning 200 with `{"error": …}` in the body, which breaks caching, monitoring, and `response.ok`; using 302 where a permanent move is meant, or 301 while still experimenting; and returning 404 for unauthorised resources without meaning to (doing so deliberately, to avoid revealing that something exists, is legitimate).

**Try it:** Request `https://httpbin.org/status/204`, `/status/301`, `/status/404`, and `/status/503` with `curl -i`, then with `curl -iL`. In the browser Console, run `fetch('https://httpbin.org/status/404').then(r => console.log(r.ok, r.status))` and confirm the promise resolves.

**Resources**
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [RFC 9110: Status codes](https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes)

### Headers

Headers are the metadata of a request or response: `Name: value` pairs, with case-insensitive names. Request headers describe the client and what it wants; response headers describe the body and how to treat it.

- **`Content-Type`** names the format of the body in *this* message: `text/html; charset=utf-8`, `application/json`. Browsers act on it, not on file extensions. A JavaScript module served as `text/plain` will be refused.
- **`Accept`** is the request-side counterpart: the formats the client would like back, with optional weights (`Accept: text/html, application/json;q=0.9`). Related headers negotiate language (`Accept-Language`) and compression (`Accept-Encoding`).
- **`Authorization`** carries credentials as `<scheme> <value>`: `Bearer eyJ…` for tokens, or `Basic` followed by base64 of `user:password`. Base64 is an encoding, not encryption.
- **`Cache-Control`** sets caching policy: how long a response may be reused and by whom. Its directives are covered under HTTP caching basics.
- **`Set-Cookie`** asks the browser to store a cookie, one cookie per header line. The browser sends it back in a `Cookie` request header.

A typical response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=0, must-revalidate
ETag: "a1b2c3"
Set-Cookie: sid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax
Vary: Accept-Encoding
```

Others you will meet soon: `Location` (redirect target), `ETag` and `If-None-Match` (validation), `Vary` (which request headers change the response), `Origin` and `Access-Control-Allow-Origin` (CORS), `Content-Security-Policy`, and `Strict-Transport-Security`.

Browser JavaScript cannot set certain "forbidden" request headers (`Host`, `Cookie`, `Origin`, and others), and cannot read most cross-origin response headers unless the server exposes them.

**Try it:** In the Network panel, click a document request and an image request on the same site. In the Headers tab, compare their `Accept` request headers and their `Content-Type` and `Cache-Control` response headers. Explain why the image is cached longer than the HTML.

**Resources**
- [MDN: HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers)
- [RFC 9110: Header fields](https://www.rfc-editor.org/rfc/rfc9110.html#name-header-fields)

### Request and response bodies

The body is a sequence of bytes; `Content-Type` is what tells the receiver how to interpret them. Three formats cover almost all request bodies you will send.

**JSON** (`application/json`), the default for APIs:

```http
POST /api/users HTTP/1.1
Content-Type: application/json

{"name":"Ada","tags":["a","b"]}
```

**Form-encoded** (`application/x-www-form-urlencoded`), what an HTML form sends by default. It is the same syntax as a query string, flat key/value pairs with percent-encoding and `+` for spaces:

```http
POST /login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

email=ada%40example.com&remember=on
```

**Multipart** (`multipart/form-data`), required for file uploads. Each field is a separate part with its own headers, separated by a boundary string declared in the `Content-Type`:

```http
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----X7a

------X7a
Content-Disposition: form-data; name="avatar"; filename="me.png"
Content-Type: image/png

(binary bytes)
------X7a--
```

The mistakes that cost people hours:

- Sending JSON with `fetch()` and forgetting `Content-Type: application/json`. A string body defaults to `text/plain`, and the server's JSON parser ignores it.
- Passing a `FormData` object to `fetch()` *and* setting `Content-Type` by hand. That omits the boundary and the server cannot parse the parts. Leave the header off; the browser adds it.
- Calling `response.json()` on an HTML error page or an empty 204 body.

Response bodies are usually compressed in transit: `Content-Encoding: br`, `gzip`, or `zstd`, chosen from the request's `Accept-Encoding`. That is why the Network panel shows two sizes per resource.

**Try it:** In DevTools, submit a login or search form on any site with the Network panel open, click the request, and open the **Payload** tab. Toggle "view source" to see the raw encoded body. Then send the three kinds with `curl` to `https://httpbin.org/post` using `-d "a=1&b=2"`, `--json '{"a":1}'`, and `-F "file=@somefile.txt"`, and compare the echoed `Content-Type`.

**Resources**
- [MDN: POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST)
- [MDN: HTTP messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages)
- [MDN: Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type)

### Cookies

HTTP has no memory, so the server hands the browser a small piece of data and the browser returns it with every later request to that site. That is the whole mechanism.

```http
HTTP/1.1 200 OK
Set-Cookie: sid=k3J9xQ; Path=/; Max-Age=1209600; Secure; HttpOnly; SameSite=Lax
```

Every later request includes `Cookie: sid=k3J9xQ`. For a **session**, the value is a random identifier; the server keeps a table mapping it to "user 42, logged in". Anyone who holds the identifier *is* that user, which is why the attributes matter:

- **`Secure`**: only sent over HTTPS.
- **`HttpOnly`**: invisible to `document.cookie`, so injected script cannot steal it. Session cookies should always have this.
- **`SameSite`**: `Strict` never sends the cookie on cross-site requests; `Lax` sends it only on top-level navigations with safe methods; `None` sends it everywhere and requires `Secure`. Chromium treats a missing attribute as `Lax`, but other browsers differ, so set it explicitly. This is your first defence against CSRF.
- **`Max-Age` / `Expires`**: without either, the cookie lasts until the browser session ends.
- **`Domain` / `Path`**: scope. Omitting `Domain` restricts the cookie to the exact host, which is the safer default. The `__Host-` name prefix enforces that.

Things people get wrong: cookies are sent automatically, including on requests the user did not intend, which is what makes CSRF possible; cookies are limited to about 4 KB each and ride on every request, so they are not general storage; and `fetch()` to another origin does not include cookies unless you pass `credentials: 'include'` and the server allows it.

Third-party cookies (set by a different site from the one in the address bar) are blocked or partitioned by default in Safari and Firefox. Chrome announced in 2025 that it would keep them, subject to user settings, so you cannot rely on them working either way.

**Try it:** Log in to a site, open DevTools > Application > Cookies, and find the session cookie. Note its flags. Delete it, reload, and observe that you are logged out. Then type `document.cookie` in the Console and see which cookies are missing from the string and why.

**Resources**
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [web.dev: SameSite cookies explained](https://web.dev/articles/samesite-cookies-explained)

### Origins

An **origin** is the combination of scheme, host, and port of a URL. Two URLs have the same origin only if all three match exactly. Compared with `https://example.com/app`:

| URL | Same origin? | Why |
| --- | --- | --- |
| `https://example.com/other?x=1` | Yes | Path and query are not part of the origin |
| `http://example.com/app` | No | Different scheme |
| `https://www.example.com/app` | No | Different host |
| `https://example.com:8443/app` | No | Different port (the default for `https` is 443) |

The browser needs this boundary because it holds many sites' secrets at once: you are logged in to your bank in one tab while an unknown page runs script in another, and the browser attaches your cookies to requests automatically. The **same-origin policy** is the rule that script from one origin cannot read data belonging to another. Concretely, across origins a script cannot:

- read the response of a `fetch()` or `XMLHttpRequest`,
- reach into the DOM of an `<iframe>` or a window it opened,
- see the other origin's `localStorage`, IndexedDB, caches, or service workers. Storage and permissions (camera, notifications) are all keyed by origin.

What is allowed across origins is *embedding and sending*: `<img>`, `<script src>`, stylesheets, `<iframe>`, links, and form submissions all work. The page can cause the request and display the result; it cannot read the bytes. This asymmetry is the root of two things you will meet later. A cross-site form `POST` still reaches the server with cookies unless `SameSite` stops it (CSRF). And a server can opt in to being read by other origins by sending `Access-Control-Allow-Origin` (CORS).

Points that trip people up:

- A "CORS error" is the browser refusing to hand the response to your script. For simple requests the server received and processed the request anyway. `curl` has no same-origin policy, which is why "it works in curl" proves nothing.
- A subdomain is a different origin. `app.example.com` and `api.example.com` need CORS to talk to each other.
- **Origin is not site.** A *site* is the scheme plus the registrable domain (`example.com`), so those two subdomains are cross-origin but same-site. Cookies and `SameSite` work at the site level; almost everything else works at the origin level.
- `http://localhost:3000` and `http://localhost:5173` are different origins, so a development front end and API hit CORS just as production would.
- Pages opened from `file://` and sandboxed iframes get an opaque origin, serialised as `null`, that matches nothing.

**Try it:** On any site, run `location.origin` in the Console. Then run `fetch('https://example.com').then(r => r.text()).then(console.log)` and read the error; open the Network panel and confirm the request was actually sent and answered. Repeat with `fetch('https://api.github.com/zen')`, which succeeds, and find the response header that made the difference.

**Resources**
- [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [web.dev: Understanding "same-site" and "same-origin"](https://web.dev/articles/same-site-same-origin)
- [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)

### HTTP caching basics

The fastest request is the one never made. HTTP caching lets the browser (a **private** cache) and CDNs or proxies (**shared** caches) store a response and reuse it. Two questions govern every reuse: is the stored copy still **fresh**, and if not, can it be **validated** cheaply?

**Freshness** is set by the server with `Cache-Control`:

- `max-age=3600`: fresh for an hour. While fresh, the browser uses its copy without contacting the server at all.
- `no-cache`: may be stored, but must be revalidated before every use.
- `no-store`: must not be stored anywhere. For sensitive responses.
- `private`: only the user's browser may store it, not a shared cache. Use for anything personalised.
- `public`, `s-maxage=…`: explicitly cacheable by shared caches, with a separate lifetime for them.
- `immutable`: the content at this URL will never change, so do not revalidate even on reload.
- `stale-while-revalidate=60`: serve the stale copy now and refresh it in the background.

**Validation** is what happens once a copy is stale. The original response carried a validator, usually an `ETag` (an opaque version identifier, often a content hash) or a `Last-Modified` date. The browser sends it back in a conditional request:

```http
GET /styles.css HTTP/1.1
If-None-Match: "a1b2c3"

HTTP/1.1 304 Not Modified
ETag: "a1b2c3"
Cache-Control: max-age=3600
```

If the resource has not changed, the server replies **304 Not Modified** with headers and no body. The browser marks its copy fresh again and reuses it. You still pay a round trip, but not the download: a few hundred bytes instead of a few hundred kilobytes.

What goes wrong:

- **No `Cache-Control` at all** does not mean "not cached". Browsers apply a heuristic, typically 10% of the time since `Last-Modified`, so a file can be silently reused for days. Always send an explicit policy.
- A long `max-age` on a URL whose content changes cannot be undone for users who already have it. The answer is fingerprinted file names, described under Hosting basics.
- Responses that differ by request header (language, encoding) need `Vary`, or a shared cache may serve the wrong variant.
- Only `GET` (and `HEAD`) responses are cached in practice.

A normal reload revalidates the document; a hard reload ignores the cache; DevTools' "Disable cache" does so for every request while it is open.

**Try it:** Pick a CSS or image URL from a real site. Run `curl -sI <url>` and copy the `etag` value. Then run `curl -sI -H 'If-None-Match: <the etag, with its quotes>' <url>` and confirm you get `304` with no `content-length` worth of body. In the browser, reload the page normally and find a 304 and a `(disk cache)` entry in the Network panel; explain why each resource got the treatment it did.

**Resources**
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [web.dev: Prevent unnecessary network requests with the HTTP Cache](https://web.dev/articles/http-cache)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)

### HTTPS

HTTPS is HTTP sent through a TLS connection. It gives you three guarantees about the link between the browser and the server named in the address bar:

- **Confidentiality**: nobody on the path (Wi-Fi operator, ISP) can read the URL path, headers, cookies, or bodies.
- **Integrity**: nobody on the path can modify the content, for example to inject ads or scripts.
- **Authentication**: the server proved it controls the private key for a certificate issued for that domain by a certificate authority your device trusts.

What it does *not* guarantee:

- That the site is honest or safe. A phishing site at `paypa1-login.example` gets a valid certificate as easily as anyone. Most certificates are domain-validated: they prove control of the domain, nothing about who is behind it.
- That your visit is hidden. Observers still see the IP address, usually the hostname (through DNS and the TLS SNI field), and the timing and size of traffic.
- Anything about what happens after the data arrives: how it is stored, or whether the server has been compromised.

This gap is why Chrome replaced the padlock with a neutral "tune" icon in 2023: users read the lock as "trustworthy".

For developers, HTTPS is also a prerequisite. Service workers, geolocation, clipboard access, HTTP/2 and HTTP/3 in browsers, and many newer APIs only work in a **secure context** (HTTPS, or `localhost`). An HTTPS page that loads a script over `http` triggers **mixed content** blocking. The `Strict-Transport-Security` header (HSTS) tells browsers to refuse plain HTTP for your domain in future, closing the window in which a first request could be intercepted.

Certificates are free and automated through ACME (Let's Encrypt and others), and most hosts handle them for you. Maximum certificate lifetimes are being reduced in stages, to 47 days by 2029, so manual renewal is no longer realistic.

**Try it:** Click the icon to the left of the URL on any HTTPS site and open the certificate details. Find the issuer, the validity dates, and the list of hostnames it covers (Subject Alternative Name). Then visit `https://expired.badssl.com/` and `https://wrong.host.badssl.com/` and read what the browser tells you in each case.

**Resources**
- [web.dev: Why HTTPS matters](https://web.dev/articles/why-https-matters)
- [MDN: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)
- [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)

### HTTP/1.1 vs HTTP/2 vs HTTP/3

All three versions carry the same semantics: the same methods, status codes, and headers. What changes is how the messages are put on the wire, and so how fast many requests can travel.

**HTTP/1.1** is plain text, and a connection handles one request at a time: the next cannot start until the previous response is complete (**head-of-line blocking**). Browsers work around this by opening up to six connections per origin, each with its own handshakes. This is the origin of old tricks such as bundling everything into one file, image sprites, and spreading assets across several hostnames.

**HTTP/2** uses binary framing and **multiplexes** many concurrent streams over a single TCP connection, with priorities. It also compresses headers with **HPACK**, which matters because cookies and user-agent strings repeat on every request. One weakness remains: TCP delivers bytes in order, so one lost packet stalls every stream on the connection until it is retransmitted. (Server push, once an HTTP/2 headline feature, has been removed from Chrome; use `103 Early Hints` or preload instead.)

**HTTP/3** runs over **QUIC**, a transport built on UDP with TLS 1.3 built in. Streams are independent, so a lost packet only delays the stream it belongs to. Connection setup takes one round trip instead of two or three (zero when resuming), and connections survive a change of network, such as Wi-Fi to mobile data. Headers use **QPACK**. Browsers discover HTTP/3 support through the `Alt-Svc` response header or an HTTPS DNS record, so the first visit often uses HTTP/2.

In practice you get HTTP/2 or HTTP/3 by using a modern host or CDN; all current browsers support both, and both require HTTPS in browsers. The practical consequence is that many small requests to one origin are cheap, while extra origins remain expensive.

**Try it:** Add the **Protocol** column to the Network panel and load a few large sites. Find requests marked `h3`, `h2`, and `http/1.1`, and note which hosts serve which. Check the document's response headers for `alt-svc`. Then run `curl -sI --http2 https://www.cloudflare.com | head -1` and compare with `--http1.1`.

**Resources**
- [MDN: Evolution of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP)
- [High Performance Browser Networking: HTTP/2](https://hpbn.co/http2/)
- [HTTP/3 explained (Daniel Stenberg)](https://http3-explained.haxx.se/)

### Browsers and engines

A browser is a user interface wrapped around an **engine** that parses HTML and CSS, lays out and paints the page, and runs JavaScript. There are three engines that matter:

| Engine | JavaScript engine | Browsers |
| --- | --- | --- |
| **Blink** | V8 | Chrome, Edge, Opera, Brave, Vivaldi, Samsung Internet |
| **WebKit** | JavaScriptCore | Safari, and in practice every browser on iOS and iPadOS |
| **Gecko** | SpiderMonkey | Firefox |

Blink was forked from WebKit in 2013, so the two share ancestry but have long since diverged. On iOS, Apple historically required all browsers to use WebKit; other engines are now permitted in some regions, but Chrome and Firefox on iPhone are still WebKit underneath for nearly all users. So "works in Chrome" tells you nothing about iPhones.

Why diversity matters: a web standard is only meaningful if independent implementations agree on it. When one engine dominates, its bugs and quirks become the de facto standard, sites get tested against it alone, and one vendor effectively decides which features the web gets. Multiple engines keep specifications honest and force features to be designed for the whole platform.

For daily work this means:

- Test in one browser per engine. Chrome plus Firefox plus Safari (or an iOS device) covers nearly everyone.
- Check support before relying on a feature. **Baseline** labels on MDN and caniuse tell you whether a feature is *newly available* (in the latest version of every major browser) or *widely available* (for 30 months or more).
- Detect features, not browsers: `@supports` in CSS, `'feature' in object` in JavaScript. User-agent sniffing breaks.
- The yearly **Interop** project is where the engine teams agree on a list of features to bring into line, and is a good preview of what will soon be usable.

**Try it:** Pick a feature you have heard of (for example `popover="hint"` or CSS anchor positioning), find it on MDN, and read the Baseline banner and the compatibility table at the bottom. State which engine shipped first, which last, and whether you would use it today without a fallback.

**Resources**
- [web.dev: Baseline](https://web.dev/baseline)
- [MDN: Browser engine (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Engine/Rendering)
- [Interop dashboard (web-platform-tests)](https://wpt.fyi/interop)

### Web standards

No single company owns the web. Its behaviour is written down in open specifications, developed by different bodies:

- **WHATWG** maintains the **living standards** for HTML, the DOM, Fetch, URL, Streams, and others. They have no version numbers and are updated continuously. Since a 2019 agreement, the WHATWG HTML Standard is the single authoritative HTML specification; "HTML5" is a historical label.
- **W3C** hosts the CSS Working Group, the accessibility work (WCAG, ARIA), and many API groups (WebAuthn, WebAssembly, and so on). W3C specifications move through maturity stages: Working Draft, Candidate Recommendation, Recommendation. CSS is split into modules that each have their own level, which is why there is no "CSS4".
- **TC39** is the Ecma committee that evolves JavaScript (ECMAScript). Proposals advance through stages 0, 1, 2, 2.7, 3, and 4; stage 3 means the design is done and engines are implementing, and stage 4 means it is in the next yearly edition (ES2025, ES2026, and so on).
- **IETF** publishes the network protocols as RFCs: HTTP, TLS, QUIC, DNS.

How a feature typically reaches you: someone writes an explainer for a real problem; it is incubated (often in the WICG or a working group); a specification is drafted alongside shared tests in **web-platform-tests**; a browser ships it, sometimes behind a flag or in an origin trial first; other engines publish their positions and implement; and once all major engines ship, it becomes Baseline.

Two consequences. A specification existing does not mean you can use the feature: what matters is implementations. And the web almost never removes things ("don't break the web"), which is why old quirks are specified rather than deleted.

Reading specifications is a skill worth building slowly. Start from MDN, and follow its "Specifications" table when you need the exact rule.

**Try it:** Open the MDN page for the `<dialog>` element and scroll to "Specifications". Follow the link into the HTML Standard and find the definition of `showModal()`. Then open the TC39 proposals repository and find one stage 3 proposal; read its README to see what an explainer looks like.

**Resources**
- [MDN: The web standards model](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/The_web_standards_model)
- [WHATWG: FAQ](https://whatwg.org/faq)
- [TC39: The TC39 process](https://tc39.es/process-document/)

### Hosting basics

Hosting means running a server that answers requests for your domain.

**Static hosting** serves files exactly as they sit on disk: HTML, CSS, JavaScript, images. Nothing is computed per request, so it is cheap, fast, and hard to break. Sites built with a build step (a React app compiled to files, a static site generator) are still static from the host's point of view. **Dynamic** hosting runs code per request: a server that queries a database and renders HTML, or an API.

The **origin server** is the source of truth, the machine or service that holds your files or runs your application.

A **CDN** (content delivery network) is a fleet of servers in many locations that sits in front of the origin. A visitor's request goes to the nearest location (the "edge"). If the edge has a fresh cached copy, it answers immediately; if not, it fetches from the origin, stores the response according to its cache headers, and serves it. The benefits are shorter round trips for every handshake and request, less load on the origin, TLS and HTTP/3 handled for you, and absorption of traffic spikes.

The standard caching pattern follows from this:

```http
# /assets/app.3f9a1c.js: the hash changes when the content does
Cache-Control: public, max-age=31536000, immutable

# /index.html: must always be checked
Cache-Control: no-cache
```

Fingerprinted assets can be cached for a year because a new version gets a new URL; the HTML that points to them must be revalidated every time.

The usual mistakes: caching HTML for a long time and then being unable to ship a fix; caching personalised responses at the edge so one user sees another's data (use `private`); and forgetting that a CDN is another cache you may need to purge.

Modern static hosts (GitHub Pages, Cloudflare, Netlify, Vercel) bundle the origin and the CDN together.

**Try it:** Run `curl -sI` against a page on a large site and look for evidence of a CDN: headers such as `cf-cache-status`, `x-cache`, `age`, `via`, or `x-served-by`. Request it twice and watch `age` grow or a MISS become a HIT.

**Resources**
- [web.dev: Content delivery networks (CDNs)](https://web.dev/articles/content-delivery-networks)
- [MDN: What is a web server?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server)

### Domains

You do not buy a domain; you rent it yearly from a **registrar**, which records it with the **registry** that runs the top-level domain (`.com`, `.dev`). The registration's key setting is its **nameservers**: which DNS provider is authoritative for the domain. That provider (often the registrar itself, or Cloudflare, Route 53, and so on) is where you edit records.

The records you need to point a domain at a host:

| Type | Name | Value | Meaning |
| --- | --- | --- | --- |
| `A` | `@` | `203.0.113.10` | The bare domain resolves to this IPv4 address |
| `AAAA` | `@` | `2001:db8::10` | The same for IPv6 |
| `CNAME` | `www` | `yourname.github.io.` | `www` is an alias of another hostname |

`@` means the domain itself (the **apex**). An **A** record maps a name to an address; a **CNAME** maps a name to another name, which is what hosts usually ask for because they can then change their IP addresses freely.

The trap: a CNAME cannot coexist with other records on the same name, and the apex always has others (NS, SOA), so **you cannot put a CNAME on the bare domain**. Use the A/AAAA addresses your host publishes, or your DNS provider's `ALIAS`/`ANAME`/"CNAME flattening" feature, which resolves the target for you.

Other records you will meet: `MX` (mail), `TXT` (domain verification, email authentication), `NS` (delegation), `CAA` (which certificate authorities may issue for you).

A sensible process: add the domain in your host's dashboard first, create the records it tells you to, verify with `dig`, then wait for the host to issue the TLS certificate. Pick one canonical hostname (apex or `www`) and redirect the other. Turn on auto-renew: an expired domain takes your site and your email down together.

**Try it:** Run `dig +short github.com A`, `dig +short www.github.com CNAME`, and `dig +short NS github.com` (or `Resolve-DnsName -Type CNAME www.github.com`). Then do the same for a site hosted on a static host and identify whether its `www` is a CNAME and how its apex is handled.

**Resources**
- [MDN: What is a domain name?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name)
- [GitHub Docs: About custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
- [GitHub Docs: Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

### Inspect a real page load

The Network panel is a table of every request the page made. Open it, tick **Disable cache**, and reload. The default columns:

- **Name**: the last segment of the URL. Hover for the full URL.
- **Status**: the HTTP status code. Greyed-out or `(failed)`, `(blocked)`, `(canceled)` entries never completed.
- **Type**: what the browser treated it as: `document`, `stylesheet`, `script`, `fetch`/`xhr`, `font`, `img`.
- **Initiator**: what caused the request: the parser at a given line, a script, a redirect, or a preload. Hover to see the call stack. This answers "why is this being loaded?"
- **Size**: bytes transferred over the network (headers plus compressed body). With large request rows enabled, the second figure is the decompressed resource size. `(disk cache)`, `(memory cache)`, or `(ServiceWorker)` means the network was not used.
- **Time**: total duration from request start to last byte.
- **Waterfall**: when each request started and how its time was spent.

Add **Protocol**, **Domain**, and **Priority** by right-clicking the header row.

Click a request and open **Timing** to see the phases: *Queueing* and *Stalled* (waiting for a connection or for higher priority work), *DNS Lookup*, *Initial connection* and *SSL*, *Request sent*, *Waiting for server response* (time to first byte, mostly server think-time plus one round trip), and *Content Download*.

The summary bar at the bottom gives request count, bytes transferred, and the `DOMContentLoaded` and `Load` times, which also appear as vertical lines in the waterfall.

Useful controls: the filter box (try `status-code:404`, `larger-than:100k`, `-domain:*.yoursite.com` to see third parties), the type filter buttons, the throttling menu, and right-click > **Block request URL** to see how the page behaves without a resource.

**Try it:** Load a site you use daily with cache disabled. Write down: the number of requests and distinct domains, the largest resource, the slowest time to first byte, the first request that was *not* initiated by the HTML parser, and which requests reused a connection (no "Initial connection" in Timing). Reload with cache enabled and note what changed in the Size column.

**Resources**
- [Chrome DevTools: Inspect network activity](https://developer.chrome.com/docs/devtools/network)
- [Chrome DevTools: Network features reference](https://developer.chrome.com/docs/devtools/network/reference)
- [Firefox DevTools: Network Monitor](https://firefox-source-docs.mozilla.org/devtools-user/network_monitor/index.html)

### Make raw requests

`curl` sends exactly the request you describe and shows you exactly what came back, with no cache, cookies, or extensions involved. That makes it the reference tool for answering "is it the server or the browser?"

```bash
curl -v https://example.com
```

In verbose output, the prefix tells you what each line is:

- `*` is curl's commentary: the IP it resolved, the connection, the TLS version, the certificate.
- `>` is a request line or header that curl sent.
- `<` is a status line or header that the server returned.
- Unprefixed text is the body.

The flags worth memorising:

| Flag | Effect |
| --- | --- |
| `-I` | Send `HEAD`; show response headers only |
| `-i` | Show response headers followed by the body |
| `-L` | Follow redirects |
| `-s` | Silent: no progress meter |
| `-o file` | Write the body to a file (`-o /dev/null` to discard) |
| `-H "Name: value"` | Add a request header |
| `-X METHOD` | Set the method |
| `-d "a=1"` | Send a form-encoded body (implies `POST`) |
| `--json '{…}'` | Send a JSON body with the right `Content-Type` and `Accept` |
| `-F "f=@path"` | Send multipart form data, including files |
| `--resolve host:443:IP` | Connect to a specific IP while keeping the hostname, for testing before DNS changes |

`-w` prints timing variables, which gives you a waterfall in one line:

```bash
curl -s -o /dev/null -w "dns %{time_namelookup}s  connect %{time_connect}s  tls %{time_appconnect}s  ttfb %{time_starttransfer}s  total %{time_total}s\n" https://example.com
```

Things to know: `-X POST` with `-d` is redundant, and `-X` with `-L` forces the method on every redirect hop, which is rarely what you want. On Windows PowerShell 5.1, use `curl.exe`. Quoting differs between shells; in PowerShell, prefer single quotes around JSON.

**Try it:** Run `curl -v http://github.com` and read every line: find the redirect status and `Location`. Add `-L` and watch the second connection include a TLS handshake. Then use `-I` on a CSS or JS file from a site you know and interpret its `cache-control`, `content-type`, `content-encoding`, and `etag`.

**Resources**
- [curl: Tutorial](https://curl.se/docs/tutorial.html)
- [curl: Man page](https://curl.se/docs/manpage.html)
- [Everything curl: Verbose](https://everything.curl.dev/usingcurl/verbose/index.html)

### Ship something

Publishing one file exercises everything in this module: a server, a URL, DNS, TLS, and HTTP headers that are now yours to inspect.

Create `index.html`. Servers treat that name as the default document for a directory, so it answers the bare URL:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hello, web</title>
  </head>
  <body>
    <h1>It works</h1>
    <p>Served over HTTPS from a real host.</p>
  </body>
</html>
```

Then pick a static host. All of these have free tiers and issue certificates automatically:

- **GitHub Pages**: create a repository, commit `index.html`, and enable Pages under Settings > Pages (deploy from the `main` branch). The site appears at `https://<user>.github.io/<repo>/`.
- **Netlify Drop**: drag a folder onto the page; you get a URL in seconds.
- **Cloudflare Pages**: connect a Git repository or upload a folder directly.

Git-based deployment is the one to practise, because it is how you will ship everything later: push a commit, the host deploys it.

After it is live, verify like an engineer rather than just looking at it:

1. `curl -sI https://your-url/` and read the status, `content-type`, and `cache-control`.
2. `curl -sI http://your-url/` and confirm the redirect to HTTPS.
3. Open the Network panel and check the protocol and the certificate.
4. Change the file, deploy, and reload. If you see the old version, work out which cache served it.

Common first-deploy problems: the file is not named `index.html` or sits in a subfolder; asset paths start with `/` but the site lives under `/<repo>/`; file-name case differs between your machine and the (case-sensitive) server.

**Try it:** Deploy the file above, then send the URL to your phone on mobile data and load it. Narrate what happened between tapping the link and seeing the heading, naming the actual host, IP address, protocol version, and status code you observed.

**Resources**
- [GitHub Docs: Quickstart for GitHub Pages](https://docs.github.com/en/pages/quickstart)
- [MDN: Publishing your website](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Your_first_website/Publishing_your_website)
- [Cloudflare Pages: Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
