import platform from "../platform/index.js";

const {TextEncoder} = platform.classes;

const encoder = typeof TextEncoder !== "undefined" && (() => {
  try {
    return new TextEncoder();
  } catch(e){
    // nothing to do
  }
})();

function encode(str) {

  if (encoder) {
    return encoder.encode(str);
  }

  // fallback (UTF-8)
  const utf8 = unescape(encodeURIComponent(str));
  const {length} = utf8;
  const arr = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    arr[i] = utf8.charCodeAt(i);
  }

  return arr;
}


export default {
  encode: (str) => encode(String(str))
};


console.log(encode('test'));
