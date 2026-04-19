# 安全政策

## ⚠️ 解压炸弹 / 响应无限缓冲

默认情况下，`maxContentLength` 与 `maxBodyLength` 均为 `-1`（不限制）。恶意或被攻陷的服务器可以返回一个很小的 gzip/deflate/brotli 压缩响应，解压后体积可达数 GB，耗尽 Node.js 进程的内存。

**如果你向不完全可信的服务器发起请求，必须根据你的业务场景设置合适的 `maxContentLength`（以及 `maxBodyLength`）。** 在流式解压过程中会按分块强制执行该限制，因此只需设置该值即可抵御解压炸弹攻击。

```js
axios.get('https://example.com/data', {
  maxContentLength: 10 * 1024 * 1024, // 10 MB
  maxBodyLength: 10 * 1024 * 1024,
});

// 或全局设置：
axios.defaults.maxContentLength = 10 * 1024 * 1024;
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

默认值未被调低是因为调低会静默地影响所有合法的大文件下载。为不可信来源选择合理的上限，应由应用自行负责。

## 报告漏洞

如果你认为在本项目中发现了安全漏洞，请按照以下说明向我们报告。我们对所有安全漏洞报告都认真对待。如果你发现的是第三方库中的漏洞，请向该库的维护者报告。

## 报告流程

请勿通过公开的 GitHub issue 报告安全漏洞。请使用 GitHub 官方安全渠道，提交 [security advisory（安全公告）](https://github.com/axios/axios/security)。

## 披露政策

收到安全漏洞报告后，我们将指定一名主要负责人，该负责人负责跟进漏洞报告，确认问题并确定受影响的版本，评估问题严重程度，开发修复方案并准备发布，在修复方案就绪后通知报告人。

## 安全更新

安全更新将在补丁开发和测试完成后尽快发布。我们将通过项目的 GitHub 仓库通知用户，并在项目的 GitHub Releases 页面发布发版说明和安全公告。我们还将弃用所有包含该安全漏洞的版本。

## 安全合作伙伴与致谢

感谢以下安全研究人员与我们合作，共同保障项目的安全：

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
