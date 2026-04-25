# TypeScript

`axios` 支持 TypeScript 类型定义，这些定义通过 npm 包中的 `index.d.ts` 文件提供。由于 axios 同时以 ESM 默认导出和 CJS `module.exports` 两种方式发布，存在以下注意事项：

- 推荐使用 `"moduleResolution": "node16"`（由 `"module": "node16"` 隐式指定），需要 TypeScript 4.7 或更高版本。
- 如果你使用 ESM，现有配置应该没有问题。
- 如果你将 TypeScript 编译为 CJS 且无法使用 `"moduleResolution": "node16"`，则必须启用 `esModuleInterop`。
- 如果你使用 TypeScript 对 CJS JavaScript 代码进行类型检查，则只能使用 `"moduleResolution": "node16"`。
