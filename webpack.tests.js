var context = require.context('./test/specs', true, /\.js$/);
context.keys().forEach(context);
