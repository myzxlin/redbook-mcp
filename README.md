# Redbook-Publish-MCP

小红书内容发布 MCP 服务器，使用 playwright 进行浏览器自动化操作，支持发布图文笔记和视频笔记。

## MCP Settings

```json
{
  "mcpServers": {
    "redbook-poster": {
      "command": "node",
      "args": [".../redbook-publish-mcp/index.js"],
      "env": {
        "phone": "your phone number",
        "jsonPath": "your local file path to store token and cookies",
        "verificationCode": "your verification code"
      }
    }
  }
}
```

## 项目启动

```bash
npm run start
```

执行后会打开浏览器，首次使用需要登录获取 cookies，在 mcp settings 环境变量中输入验证码完成登录流程。
登录成功后，cookies 和 token 将保存在 jsonPath 目录下。后续登录将使用保存的 cookies 和 token。

### tool 示例

- 发布图文笔记 create_note

```json
{
  "title": "测试标题",
  "content": "这是一条图文笔记",
  "images": ["https://example.com/image.jpg", "/path/to/image.jpg"]
}
```

- 发布视频笔记 create_video_note

```json
{
  "title": "测试标题",
  "content": "这是一条视频笔记",
  "videos": ["https://example.com/video.mp4"]
}
```
