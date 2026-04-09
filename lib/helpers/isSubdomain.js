const isSubdomain = (sub, domain) => {
  let diff = sub.length - domain.length;
  return diff > 2 && sub[diff - 1] === "." && sub.endsWith(domain);
}

export default isSubdomain;
