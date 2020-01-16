'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter (config) {
    return new Promise(function dispatchXhrRequest (resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        // 判断是否是FormData对象，如果是删除header的'Content-Type'字段，让浏览器自动设置'Content-Type'字段
        if (utils.isFormData(requestData)) {
            delete requestHeaders['Content-Type']; // Let the browser set it
        }

        // 创建xhr对象
        var request = new XMLHttpRequest();

        // HTTP basic authentication
        // 设置请求头中的authentication字段
        // 关于Authorization字段
        if (config.auth) {
            var username = config.auth.username || '';
            var password = config.auth.password || '';
            // 使用btoa方法base64编码username和password
            requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        // 构建全路径
        var fullPath = buildFullPath(config.baseURL, config.url);
        console.log(fullPath)

        // 初始化一个请求。该方法只能在 JavaScript 代码中使用，若要在 native code 中初始化请求，请使用 openRequest()。
        /**
         * method: 要使用的HTTP方法，比如「GET」、「POST」、「PUT」、「DELETE」、等。对于非HTTP(S) URL被忽略。
         * url: 一个DOMString表示要向其发送请求的URL。
         * async: 一个可选的布尔参数，默认为true，表示要不要异步执行操作。如果值为false，send()方法直到收到答复前不会返回。如果true，已完成事务的通知可供事件监听器使用。如果multipart属性为true则这个必须为true，否则将引发异常。
         */
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        // 设置超时时间
        request.timeout = config.timeout;

        // Listen for ready state
        /**
         * 只要 readyState 属性发生变化，就会调用相应的处理函数。
         * 这个回调函数会被用户线程所调用。XMLHttpRequest.onreadystatechange
         * 会在 XMLHttpRequest 的readyState 属性发生改变时触发 readystatechange 事件的时候被调用。
         */
        request.onreadystatechange = function handleLoad () {
            if (!request || request.readyState !== 4) {
                return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            /**
             * 只读属性 XMLHttpRequest.status 返回了XMLHttpRequest 响应中的数字状态码。
             * status 的值是一个无符号短整型。在请求完成前，status的值为0。
             * 值得注意的是，如果 XMLHttpRequest 出错，浏览器返回的 status 也为0。
             * 但是file协议除外，status等于0也是一个成功的请求.
             */
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
                return;
            }

            // Prepare the response：准备响应
            /**
             * XMLHttpRequest.getAllResponseHeaders() 方法返回所有的响应头，
             * 以 CRLF 分割的字符串，或者 null 如果没有收到任何响应。
             * 注意： 对于复合请求 （ multipart requests ），这个方法返回当前请求的头部，而不是最初的请求的头部。
             */
            var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
            /**
             * 如果没有设置数据响应类型（默认为“json”）或者responseType设置为text时，获取request.responseText值否则是获取request.response
             * responseType是一个枚举类型，手动设置返回数据的类型
             * responseText是全部后端的返回数据为纯文本的值
             * response为正文，response的类型取决于responseType
             */
            var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
            // 转化响应信息
            var response = {
                data: responseData, // 响应正文
                status: request.status, // 响应状态
                statusText: request.statusText, // 响应文本信息
                headers: responseHeaders, // 响应头
                config: config,
                request: request
            };

            // status >= 200 && status < 300 resolve
            // 否则reject
            settle(resolve, reject, response);

            // Clean up request
            request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        // 请求中断时触发
        request.onabort = function handleAbort () {
            if (!request) {
                return;
            }

            // 抛出Request aborted错误
            reject(createError('Request aborted', config, 'ECONNABORTED', request));

            // Clean up request
            request = null;
        };

        // Handle low level network errors
        // 请求失败时触发
        request.onerror = function handleError () {
            // Real errors are hidden from us by the browser
            // onerror should only fire if it's a network error
            // 抛出NetWork Error
            reject(createError('Network Error', config, null, request));

            // Clean up request
            request = null;
        };

        // Handle timeout
        // 请求超时触发
        request.ontimeout = function handleTimeout () {
            var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
            if (config.timeoutErrorMessage) {
                timeoutErrorMessage = config.timeoutErrorMessage;
            }
            // 抛出timeout错误
            reject(createError(timeoutErrorMessage, config, 'ECONNABORTED', request));

            // Clean up request
            request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        /**
         * 判断当前是否为标准浏览器，如果是添加xsrf头
         * 什么是xsrf header？ xsrf header是用来防御CSRF攻击
         * 原理是服务端生成一个XSRF-TOKEN，并保存到浏览器的cookie中，在每次请求中ajax都会将XSRF-TOKEN设置到request header中
         * 服务器会比较cookie中的XSRF-TOKEN与header中XSRF-TOKEN是否一致
         * 根据同源策略，非同源的网站无法读取修改本源的网站cookie，避免了伪造cookie
         */
        if (utils.isStandardBrowserEnv()) {
            var cookies = require('./../helpers/cookies');

            // Add xsrf header
            /**
             * withCredentials设置跨域请求中是否应该使用cookie（设置了withCredentials为true或者是同源请求）并且设置xsrfCookieName
             */
            var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
                // 读取cookie中XSRF-TOKEN
                cookies.read(config.xsrfCookieName) :
                undefined;

            if (xsrfValue) {
                requestHeaders[config.xsrfHeaderName] = xsrfValue;
            }
        }

        // Add headers to the request
        /**
         * XMLHttpRequest.setRequestHeader() 是设置HTTP请求头部的方法。此方法必须在  open() 方法和 send()   之间调用。
         * 如果多次对同一个请求头赋值，只会生成一个合并了多个值的请求头。
         * 如果没有设置 Accept 属性，则此发送出send() 的值为此属性的默认值 。
         * 安全起见，有些请求头的值只能由user agent设置：forbidden header names和forbidden response header names.
         */
        if ('setRequestHeader' in request) {
            // 将config中配置的requestHeaders，循环设置到请求头上
            utils.forEach(requestHeaders, function setRequestHeader (val, key) {
                if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
                    // Remove Content-Type if data is undefined
                    delete requestHeaders[key];
                } else {
                    // Otherwise add header to the request
                    request.setRequestHeader(key, val);
                }
            });
        }

        // Add withCredentials to request if needed
        // 设置xhr对象的withCredentials属性，是否允许cookie进行跨域请求
        if (!utils.isUndefined(config.withCredentials)) {
            request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        // 设置xhr对象的responseType属性
        if (config.responseType) {
            try {
                request.responseType = config.responseType;
            } catch (e) {
                // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
                // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
                if (config.responseType !== 'json') {
                    throw e;
                }
            }
        }

        // Handle progress if needed
        // 下载进度
        if (typeof config.onDownloadProgress === 'function') {
            request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        // 上传进度
        if (typeof config.onUploadProgress === 'function' && request.upload) {
            request.upload.addEventListener('progress', config.onUploadProgress);
        }

        // 如果配置了cancelToken选项
        if (config.cancelToken) {
            // Handle cancellation
            // 对CancelToken中创建的Promise添加成功的回调
            // 当调用CancelToken.source暴露的cancel函数时，回调会被触发
            config.cancelToken.promise.then(function onCanceled (cancel) {
                if (!request) {
                    return;
                }
                // 取消xhr请求
                request.abort();
                // 将axios返回的promise，置为reject状态
                reject(cancel);
                // Clean up request： 清除request
                request = null;
            });
        }

        if (requestData === undefined) {
            requestData = null;
        }

        // Send the request
        // 发送请求。如果请求是异步的（默认），那么该方法将在请求发送后立即返回。
        request.send(requestData);
    });
};
