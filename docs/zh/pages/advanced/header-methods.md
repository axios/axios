# 请求头方法 <Badge type="tip" text="新特性" />

随着新 `AxiosHeaders` 类的引入，axios 提供了一组操作请求头的方法，比直接操作请求头对象更加方便。

## 构造函数 `new AxiosHeaders(headers?)`

`AxiosHeaders` 类的构造函数接受一个可选的请求头对象来初始化实例，对象可以包含任意数量的请求头，且键名不区分大小写。

```js
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

为方便起见，你可以传入一个以换行符分隔的请求头字符串，它们会被解析并添加到实例中。

```js
const headers = new AxiosHeaders(`
Host: www.bing.com
User-Agent: curl/7.54.0
Accept: */*`);

console.log(headers);

// Object [AxiosHeaders] {
//   host: 'www.bing.com',
//   'user-agent': 'curl/7.54.0',
//   accept: '*/*'
// }
```

## Set

`set` 方法用于在 `AxiosHeaders` 实例上设置请求头，可以传入单个请求头名称和值、包含多个请求头的对象，或以换行符分隔的请求头字符串。该方法还接受一个可选的 `rewrite` 参数，用于控制设置请求头时的覆盖行为。

```js
set(headerName, value: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher);
set(headerName, value, rewrite?: (this: AxiosHeaders, value: string, name: string) => boolean);
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean);
```

`rewrite` 参数控制覆盖行为：

- `false` - 如果请求头的值已设置（不为 undefined），则不覆盖
- `undefined`（默认）- 覆盖请求头，除非其值被设置为 false
- `true` - 始终覆盖

该参数也可以接受一个用户自定义函数，用于决定是否应覆盖该值，函数接收当前值、请求头名称和请求头对象作为参数。

`AxiosHeaders` 会保留第一个匹配键的大小写形式。你可以利用这一特性，先以 `undefined` 值预设一个键名，之后再设置值，从而保留特定的请求头大小写。详见[保留特定请求头大小写](/pages/advanced/headers#preserving-a-specific-header-case)。

## Get

`get` 方法用于获取请求头的值，可以传入单个请求头名称、可选的匹配器或解析器。匹配器默认为 `true`，解析器可以是用于从请求头中提取值的正则表达式。

```js
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
get(headerName: string, parser: RegExp): RegExpExecArray | null;
```

以下是 `get` 方法的一些使用示例：

```js
const headers = new AxiosHeaders({
  'Content-Type': 'multipart/form-data; boundary=Asrf456BGe4h',
});

console.log(headers.get('Content-Type'));
// multipart/form-data; boundary=Asrf456BGe4h

console.log(headers.get('Content-Type', true)); // 解析以 \s,;= 为分隔符的键值对字符串：
// [Object: null prototype] {
//   'multipart/form-data': undefined,
//    boundary: 'Asrf456BGe4h'
// }

console.log(
  headers.get('Content-Type', (value, name, headers) => {
    return String(value).replace(/a/g, 'ZZZ');
  })
);
// multipZZZrt/form-dZZZtZZZ; boundZZZry=Asrf456BGe4h

console.log(headers.get('Content-Type', /boundary=(\w+)/)?.[0]);
// boundary=Asrf456BGe4h
```

## Has

`has` 方法用于检查 `AxiosHeaders` 实例中是否存在某个请求头，可以传入单个请求头名称和可选的匹配器。

```js
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

::: info
如果请求头已设置（值不为 undefined），则返回 true。
:::

## Delete

`delete` 方法用于从 `AxiosHeaders` 实例中删除某个请求头，可以传入单个请求头名称和可选的匹配器。

```js
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

::: info
如果至少有一个请求头被移除，则返回 true。
:::

## Clear

`clear` 方法用于在不传入任何参数时删除 `AxiosHeaders` 实例中的所有请求头。如果传入匹配器，则只移除与匹配器匹配的请求头，此时匹配器用于匹配请求头名称而非值。

```js
clear(matcher?: AxiosHeaderMatcher): boolean;
```

::: info
如果至少有一个请求头被清除，则返回 true。
:::

## Normalize

如果直接修改了请求头对象，可能导致相同名称但大小写不同的重复项。此方法通过将重复键合并为一个来规范化请求头对象。axios 在每个拦截器调用后内部使用此方法。将 format 设置为 true 可将请求头名称转换为首字母大写的格式（cOntEnt-type => Content-Type），设置为 false 则保留原始格式。

```js
const headers = new AxiosHeaders({
  foo: '1',
});

headers.Foo = '2';
headers.FOO = '3';

console.log(headers.toJSON()); // [Object: null prototype] { foo: '1', Foo: '2', FOO: '3' }
console.log(headers.normalize().toJSON()); // [Object: null prototype] { foo: '3' }
console.log(headers.normalize(true).toJSON()); // [Object: null prototype] { Foo: '3' }
```

::: info
返回 `this` 以支持链式调用。
:::

## Concat

将实例与目标对象合并到一个新的 AxiosHeaders 实例中。如果目标是字符串，它将被解析为原始 HTTP 请求头；如果目标是 AxiosHeaders 实例，它将与当前实例合并。

这对于组合请求头时的大小写预设非常有用，例如：

```js
const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);
```

```js
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

::: info
返回一个新的 AxiosHeaders 实例。
:::

## toJSON

将所有内部请求头值解析到一个新的 null 原型对象中。将 `asStrings` 设置为 true 可将数组解析为以逗号分隔的字符串。

```js
toJSON(asStrings?: boolean): RawAxiosHeaders;
```

## From

从传入的原始请求头创建并返回一个新的 `AxiosHeaders` 实例；如果传入的已经是 `AxiosHeaders` 实例，则直接返回该实例。

```js
from(thing?: AxiosHeaders | RawAxiosHeaders | string): AxiosHeaders;
```

## 快捷方法

以下快捷方法可供使用：

- `setContentType`、`getContentType`、`hasContentType`
- `setContentLength`、`getContentLength`、`hasContentLength`
- `setAccept`、`getAccept`、`hasAccept`
- `setUserAgent`、`getUserAgent`、`hasUserAgent`
- `setContentEncoding`、`getContentEncoding`、`hasContentEncoding`
