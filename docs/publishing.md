# opencode-notify-tool 发布流程

这份文档只覆盖 `opencode-notify-tool` 的发布链路。

## 手动首发

首次发布时，先在干净工作区跑 fresh 验证，再用本地账号直接发到 npm。

```powershell
npm test
npm pack --dry-run --json
npm view opencode-notify-tool version --json
npm whoami
npm publish --access public
```

要点：

- `npm test` 必须是当前这次发布前刚跑出来的结果，不能复用旧日志。
- `npm pack --dry-run --json` 的 `files` 结果必须只包含允许的 7 个文件。
- `npm view opencode-notify-tool version --json` 如果已经返回版本号，说明这个版本已经存在，不能再拿去首发。
- `npm whoami` 用来确认当前 npm 身份和发布账号。
- `npm publish --access public` 是手动首发的最后一步。

## 发布前 fresh 验证

每次准备首发或重新发布前，都要重新跑一遍验证，不接受旧结果。

```powershell
npm test
npm pack --dry-run --json
npm view opencode-notify-tool version --json
npm whoami
```

检查结果时，重点看这几件事：

- 测试必须通过。
- `npm pack --dry-run --json` 的文件列表必须是：
  - `LICENSE`
  - `README.md`
  - `dist/index.d.ts`
  - `dist/index.js`
  - `dist/notify-tool.d.ts`
  - `dist/notify-tool.js`
  - `package.json`
- `npm view opencode-notify-tool version --json` 必须明确说明当前版本还没有被发布，或者返回找不到该版本。
- `npm whoami` 必须是你打算用于发布的 npm 账号。

## npm Trusted Publisher 设置与验证

首次手动首发完成后，配置 npm Trusted Publisher。命令如下：

```powershell
npx --yes npm@latest trust github opencode-notify-tool --file release.yml --repo jiwangyihao/opencode-notify-tool --yes
npx --yes npm@latest trust list opencode-notify-tool --json
```

说明：

- 这里的 `release.yml` 指的是 `.github/workflows/release.yml`。
- 第一条命令把 GitHub Actions 里的 release workflow 注册成 Trusted Publisher。
- 第二条命令用来确认仓库已经出现在 trusted publisher 列表里。

## 后续 GitHub Actions 发布

Trusted Publisher 配好之后，后续发布都交给 GitHub Actions。流程是先在 GitHub 上创建已发布的 Release，再让 `.github/workflows/release.yml` 自动执行构建和发布。

```powershell
npm view opencode-notify-tool version --json
npm publish --access public
```

说明：

- workflow 会先检查当前版本是否已经存在。
- 如果版本已经发布，`Publish` 步骤会跳过。
- 这不是失败，这是预期行为。

## GitHub Release 创建与验证

创建 Release 时，使用固定的版本号和发布说明文件。

```powershell
gh release create v0.1.0 --repo jiwangyihao/opencode-notify-tool --target master --title "v0.1.0" --notes-file docs/release-notes-v0.1.0.md --latest
```

验证点：

- Release 创建成功后，确认对应 workflow 已经被触发。
- 如果这是首发，workflow 的 `Publish` 步骤可能跳过，因为 npm 端已经有同版本包了。
- 如果不是首发，workflow 应该完成构建、测试和发布。

## 部分失败恢复

有两种常见的半失败状态。

1. 如果 `npm publish` 已经成功，但 GitHub Release 失败，先修复 `gh release create`，然后重试创建 Release。此时 workflow 里 `Publish` step skipped 是预期结果，因为 npm 版本已经存在。
2. 如果 GitHub Release 已经创建，但 workflow 失败，先修复 Trusted Publisher 或 workflow，然后重新触发 release workflow。不能只把 `npm publish` 成功当成整条发布链路完成。
