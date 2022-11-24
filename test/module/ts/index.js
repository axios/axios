"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const axios_1 = __importStar(require("axios"));
assert_1.default.strictEqual(typeof axios_1.default, 'function');
assert_1.default.strictEqual(typeof axios_1.CanceledError, 'function');
assert_1.default.strictEqual(typeof axios_1.AxiosError, 'function');
assert_1.default.strictEqual(typeof axios_1.AxiosHeaders, 'function');
assert_1.default.strictEqual(typeof axios_1.formToJSON, 'function');
assert_1.default.strictEqual(typeof axios_1.spread, 'function');
assert_1.default.strictEqual(typeof axios_1.isAxiosError, 'function');
assert_1.default.strictEqual(typeof axios_1.isCancel, 'function');
assert_1.default.strictEqual(typeof axios_1.all, 'function');
assert_1.default.strictEqual(typeof axios_1.toFormData, 'function');
assert_1.default.strictEqual(typeof axios_1.default.CanceledError, 'function');
assert_1.default.strictEqual(typeof axios_1.default.AxiosError, 'function');
assert_1.default.strictEqual(typeof axios_1.default.AxiosHeaders, 'function');
assert_1.default.strictEqual(typeof axios_1.default.formToJSON, 'function');
assert_1.default.strictEqual(typeof axios_1.default.spread, 'function');
assert_1.default.strictEqual(typeof axios_1.default.isAxiosError, 'function');
assert_1.default.strictEqual(typeof axios_1.default.isCancel, 'function');
assert_1.default.strictEqual(typeof axios_1.default.all, 'function');
assert_1.default.strictEqual(typeof axios_1.default.toFormData, 'function');
