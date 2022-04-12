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

// (https://example.com/parent/child) -> child
export function getLastUrlSegment(url: URL): string {
  const parts = url.pathname.split("/").filter((part) => part !== "");
  return parts[parts.length - 1];
}

export function log(tag: string, msg: string): void {
  console.log(`${tag} : ${msg}`);
}

// ["./a/b/c", "d/e"] -> 'a/b/c/d/e'
export function joinPaths(parts: string[]): string {
  return parts
    .flatMap((part) =>
      part.split("/").filter((val) => val !== "." && val !== "")
    )
    .join("/");
}

// eslint-disable-next-line
export function unwrapProxy(proxy: any): any {
  try {
    return JSON.parse(JSON.stringify(proxy));
  } catch (error) {
    return {};
  }
}

export async function loggy(data: Object) {
  fetch("https://loggy.liberationtech.net:9001/log/", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
