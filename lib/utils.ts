'use strict';

import type { Stream } from 'stream';
import bind from './helpers/bind'

// utils is a library of generic helper functions non-specific to axios

const toString = Object.prototype.toString;

// eslint-disable-next-line func-names
const kindOf = ((cache: any) => {
  // eslint-disable-next-line func-names
  return (thing: any) => {
    const str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  };
})(Object.create(null));

export const kindOfTest = (type: string) => {
  type = type.toLowerCase();
  return (thing: string) => kindOf(thing) === type
}

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an Array, otherwise false
 */
export const isArray = (val: any): val is any[] => Array.isArray(val)

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if the value is undefined, otherwise false
 */
export const isUndefined = (val: any): val is undefined => typeof val === 'undefined'

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
// function isBuffer(val) {
//   return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
//     && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
// }
export const isBuffer = (val: any) =>
  val !== null
  && !isUndefined(val)
  && val.constructor !== null
  && !isUndefined(val.constructor)
  && typeof val.constructor.isBuffer === 'function'
  && val.constructor.isBuffer(val);

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
export const isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
export const isArrayBufferView = (val: any): val is ArrayBufferView => {
  let result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a String, otherwise false
 */
export const isString = (val: any): val is string => typeof val === 'string'

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a Number, otherwise false
 */
export const isNumber = (val: any): val is number => typeof val === 'number'

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an Object, otherwise false
 */
export const isObject = (val: any): val is object => val !== null && typeof val === 'object'

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
export function isPlainObject(val: object): boolean {
  if (kindOf(val) !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a Date, otherwise false
 */
export const isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
export const isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a Blob, otherwise false
 */
export const isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
export const isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a Function, otherwise false
 */
export const isFunction = (val: any): val is Function => toString.call(val) === '[object Function]'

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a Stream, otherwise false
 */
export const isStream = (val: any): val is Stream => isObject(val) && isFunction((val as Stream).pipe)

/**
 * Determine if a value is a FormData
 *
 * @param {Object} thing The value to test
 *
 * @returns {boolean} True if value is an FormData, otherwise false
 */
export const isFormData = (thing: any): thing is FormData => {
  var pattern = '[object FormData]';
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) ||
    toString.call(thing) === pattern ||
    (isFunction(thing.toString) && thing.toString() === pattern)
  );
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
export const isURLSearchParams = kindOfTest('URLSearchParams');

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 *
 * @returns {String} The String freed of excess whitespace
 */
export const trim = (str: string) => str?.trim() ?? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 *
 * @returns {boolean}
 */
export const isStandardBrowserEnv = (): boolean => {
  var product;
  if (typeof navigator !== 'undefined' && (
    (product = navigator.product) === 'ReactNative' ||
    product === 'NativeScript' ||
    product === 'NS')
  ) {
    return false;
  }

  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 *
 * @returns {void}
 */
export function forEach<T>(obj: T[], fn: (item: T, key: number, source: T[]) => any): void
export function forEach<O extends Record<string | number | symbol, any>, K extends keyof O, Item extends O[K]>(obj: O, fn: (item: Item, key: K, source: O) => any): void
export function forEach(obj: any, fn: (item: any, key: any, source: any) => any): void {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (let i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 *
 * @returns {Object} Result of all merge properties
 */
export function merge(...args: object[]) {
  const result: Record<keyof any, any> = {};
  function assignValue(val: object, key: keyof any) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (let i = 0, l = args.length; i < l; i++) {
    forEach(args, assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 *
 * @returns {Object} The resulting value of object a
 */
export const extend = (a: Record<keyof any, any>, b: Record<keyof any, any>, thisArg: object) => {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 *
 * @returns {string} content value without BOM
 */
export const stripBOM = (content: string) => {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 *
 * @returns {void}
 */
export const inherits = (constructor: Function, superConstructor: Function, props: object | null, descriptors: PropertyDescriptorMap & ThisType<any>) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  props && Object.assign(constructor.prototype, props);
}

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function|Boolean} [filter]
 * @param {Function} [propFilter]
 *
 * @returns {Object}
 */
export const toFlatObject = <Source extends object, Dest extends object, K extends keyof Source>(sourceObj: Source, destObj: Dest, filter: Function | null, propFilter?: Function): object => {
  let props: Array<K>;
  let i: number;
  let prop: K;
  let merged: Record<K, boolean> = {} as Record<K, boolean>;

  destObj = destObj || {};
  // eslint-disable-next-line no-eq-null,eqeqeq
  if (sourceObj == null) return destObj;

  do {
    props = Object.getOwnPropertyNames(sourceObj) as unknown as Array<K>;
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        // @ts-expect-error
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter !== null && Object.getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
}

/**
 * Determines whether a string ends with the characters of a specified string
 *
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 *
 * @returns {boolean}
 */
export const endsWith = (str: string, searchString: string, position: number) => {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}


/**
 * Returns new array from array like object or null if failed
 *
 * @param {*} [thing]
 *
 * @returns {?Array}
 */
export const toArray = (thing: any) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

/**
 * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
 * thing passed in is an instance of Uint8Array
 *
 * @param {TypedArray}
 *
 * @returns {Array}
 */
// eslint-disable-next-line func-names
export const isTypedArray = ((TypedArray: TypedArrayConstructor) => {
  // eslint-disable-next-line func-names
  return (thing: any): thing is typeof TypedArray =>
    TypedArray && thing instanceof TypedArray
})(typeof Uint8Array !== 'undefined' && Object.getPrototypeOf(Uint8Array));

/**
 * For each entry in the object, call the function with the key and value.
 *
 * @param {Object<any, any>} obj - The object to iterate over.
 * @param {Function} fn - The function to call for each entry.
 *
 * @returns {void}
 */
export const forEachEntry = <T extends Iterable<any>>(obj: T, fn: Function) => {
  const generator = obj && obj[Symbol.iterator];

  const iterator = generator.call(obj);

  let result;

  while ((result = iterator.next()) && !result.done) {
    let pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
}

/**
 * It takes a regular expression and a string, and returns an array of all the matches
 *
 * @param {string} regExp - The regular expression to match against.
 * @param {string} str - The string to search.
 *
 * @returns {Array<boolean>}
 */
export const matchAll = (regExp: RegExp, str: string) => {
  var matches;
  var arr = [];

  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }

  return arr;
}

/* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
export const isHTMLForm = kindOfTest('HTMLFormElement');

/* Creating a function that will check if an object has a property. */
export const hasOwnProperty = (function resolver(_hasOwnProperty) {
  return function (obj: object, prop: keyof any) {
    return _hasOwnProperty.call(obj, prop);
  };
})(Object.prototype.hasOwnProperty);


/**
 * Determine if a value is a RegExp object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a RegExp object, otherwise false
 */
export const isRegExp = kindOfTest('RegExp');

export function reduceDescriptors<T extends Record<string | number | symbol, any>>(obj: T, reducer: (descriptor: PropertyDescriptor, name: keyof T, object: T) => boolean | void) {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {} as PropertyDescriptorMap;

  forEach(descriptors, (descriptor: PropertyDescriptor, name) => {
    if (reducer(descriptor, name, obj) !== false) {
      reducedDescriptors[name] = descriptor;
    }
  });

  Object.defineProperties(obj, reducedDescriptors);
}

/**
 * Makes all methods read-only
 * @param {Object} obj
 */

export function freezeMethods<T extends object>(obj: T) {
  reduceDescriptors(obj, (descriptor, name) => {
    const value = obj[name];

    if (!isFunction(value)) return;

    descriptor.enumerable = false;

    if ('writable' in descriptor) {
      descriptor.writable = false;
      return;
    }

    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error('Can not read-only method \'' + name.toString() + '\'');
      };
    }
  });
}

export function toObjectSet<T extends string[] | string>(arrayOrString: T, delimiter: string = '') {
  const obj = {} as Record<string, true>;

  function define(arr: Array<any>) {
    arr.forEach(value => {
      obj[value] = true;
    });
  }

  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter))

  return obj;
}

export function noop() { }

export function toFiniteNumber(value: number, defaultValue: number) {
  value = +value;
  return Number.isFinite(value) ? value : defaultValue;
}