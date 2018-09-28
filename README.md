### Source

Forked from  [axios](https://github.com/axios/axios)

### Extra

support wechat miniprogram request

### Install

```bash
npm install wx-axios --save
```

### Use

```javascript
import axios from 'wx-axios';
```

And then you can use axios in wechat miniprogram as usual.

### Tip

if you can't use npm, you can clone this respo and `npm run build`, then get `axios.min.js` from './dist/'.
Clone this file into your miniprogram project utils.
However, you can use it:
`import axios from './utils/axios.min.js';`

### Run weapp example
if you use native wechat-weapp,you should see code in native-wechat-weapp in the folder 'examples';
if you use wepy to build your weapp,you can run `npm run wepy-example` to get an example.
In order to use native wechat-app or wepy,you ought to view offical documentation