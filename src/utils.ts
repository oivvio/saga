// given https://example.com/parent/child -> https://example.com/parent
export function getParentUrl(url: URL): URL {
  const pathParts = url.pathname.split("/");
  pathParts.pop();
  const newPath = pathParts.join("/");
  const newURLString = url.protocol + "//" + url.host + newPath;
  return new URL(newURLString);
}

// (https://example.com/parent, child) -> https://example.com/parent/child
export function getChildUrl(baseUrl: URL, childPath: string): URL {
  const childPathParts = childPath.split("/").filter((part) => part != ".");
  const newPath = baseUrl.pathname.split("/").concat(childPathParts).join("/");
  const newURLString = baseUrl.protocol + "//" + baseUrl.host + newPath;

  return new URL(newURLString);
}

export function log(tag: string, msg: string): void {
  console.log(`${tag} : ${msg} : ${log.callee.caller.name}`);
}
