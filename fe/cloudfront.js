function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Pass static assets through unchanged
  if (uri.match(/\.[a-zA-Z0-9]+$/)) return request;

  // /projects/<slug> → the dynamic route HTML
  if (uri.match(/^\/projects\/[^\/]+$/)) {
    request.uri = "/projects/[projectName].html";
    return request;
  }

  // /profile/<userId>
  if (uri.match(/^\/profile\/[^\/]+$/)) {
    request.uri = "/profile/[userId].html";
    return request;
  }

  // Everything else: /foo → /foo.html, /foo/ → /foo/index.html
  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  } else {
    request.uri = uri + ".html";
  }

  return request;
}
