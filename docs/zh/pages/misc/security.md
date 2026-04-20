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

## 验证发布版本

自 `axios` 在 npm 上发布的每一个 tarball 均通过 GitHub Actions 发布，并附带 [npm provenance 证明](https://docs.npmjs.com/generating-provenance-statements)，以密码学方式将软件包与生成它的工作流及提交 SHA 绑定。

使用者可在本地验证该证明：

```bash
# 验证你 lockfile 中的所有包（包括 axios）
npm audit signatures
```

验证通过仅证明该 tarball 是在 `axios/axios` 的 GitHub Actions 环境中、基于已知 commit 构建的，且在构建至 registry 之间未被篡改。它**不**证明该 commit 中的代码没有 bug。

如果 `npm audit signatures` 针对较新版本的 `axios` 报告缺失或无效的证明，请视为潜在的供应链事件，并通过下方的私密渠道上报。

## 报告漏洞

如果你认为在本项目中发现了安全漏洞，请按照以下说明向我们报告。我们对所有安全漏洞报告都认真对待。如果你发现的是第三方库中的漏洞，请向该库的维护者报告。

## 报告流程

请勿通过公开的 GitHub issue 报告安全漏洞。请使用 GitHub 官方安全渠道，提交 [security advisory（安全公告）](https://github.com/axios/axios/security/advisories/new)。

## 披露政策

收到安全漏洞报告后，我们将指定一名主要负责人。该负责人负责确认问题、确定受影响版本、评估严重程度、开发并发布修复，并与报告人协调公开披露。

### 60 天解决与披露承诺

我们承诺 **在收到初次报告后 60 个自然日内解决并公开披露每一个有效的安全公告**，计时从通过 [GitHub 安全公告渠道](https://github.com/axios/axios/security/advisories/new) 接到报告的那一刻起算。

这 60 天是对报告人和下游使用者的硬性承诺，是底线而非目标。如果我们无法在期限内发布修复，也会在第 60 天公开发布公告，提供当前可行的最佳缓解指引，让使用者能够采取行动。

**60 天窗口内的各里程碑：**

| 天    | 里程碑                                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------- |
| 0     | 收到报告。在 GitHub 上开启私密公告。                                                                 |
| ≤ 3   | 向报告人发送确认收到。分流决定：在范围内 / 不在范围内 / 重复 / 需补充信息。                          |
| ≤ 10  | 评估严重程度（在适用时使用 CVSS v4）。确认受影响版本。如有必要，经由 GitHub 申请 CVE。               |
| ≤ 45  | 修复已开发、评审、测试完毕。在私有分支上准备候选版本。向报告人提供预览以便验证。                     |
| ≤ 60  | 已修复版本发布至 npm。公开公告 + CVE 发布。除非报告人另有要求，否则给予署名。更新 CHANGELOG。        |

**例外与延期。**

- 如果报告人要求缩短禁运期（例如计划在会议上披露研究成果），我们会尽量配合。
- 如果修复需要引入破坏性变更、需与主要下游使用者协调、或依赖 `follow-redirects` / `form-data` / `proxy-from-env` 的上游发布，我们可能将期限延长至 60 天以上。任何延期都会在第 60 天通过公告公开披露，并说明修订后的预期时间与原因。
- 如果报告**不在范围内**（例如属于项目 [威胁模型](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md) 中明确列出的 non-goal），我们会在分流窗口内（≤ 3 天）向报告人说明并关闭。不在范围内的报告不会进入 60 天队列。
- **正在被实际利用的漏洞** 按事件处理：修复与公告在补丁验证通过后立即发布，而非按 60 天时间表。

**对报告人的期望。**

在报告处于禁运期时，我们请报告人在以下较早发生的时间点之前不要公开披露：(a) 协调披露的公告发布，或 (b) 第 60 天。如果我们未在 60 天内行动，报告人即可自行披露——我们会将其视为我们的失败，而非报告人的失败。

## 安全更新

安全更新将在补丁开发和测试完成后尽快发布。我们将通过项目的 GitHub 仓库通知用户，并在项目的 GitHub Releases 页面发布发版说明和安全公告。我们还将弃用所有包含该安全漏洞的版本。

## 维护者侧事件响应

对于影响维护者账号、工作站或发布基础设施的入侵场景（钓鱼、硬件密钥丢失、异常 tag/发布），项目在 [THREATMODEL.md §3.7](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md#37-incident-response-runbook) 中维护了一份内部事件响应手册。内容涵盖会话吊销、密钥轮换、下游通知、以及取消发布/弃用流程。

## 安全合作伙伴与致谢

感谢以下安全研究人员与我们合作，共同保障项目的安全：

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
