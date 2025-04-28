/**
 * 小红书自动发稿服务
 */
import { chromium } from 'playwright';
import fs from "fs";
import path from "path";

export class RedbookPoster {
  constructor(jsonPath = "/tmp") {
    this.cookiesFile = path.join(jsonPath, "redbook_cookies.json");
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: false
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async _loadCookies() {
    if (fs.existsSync(this.cookiesFile)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(this.cookiesFile, "utf8"));
        await this.page.goto("https://creator.xiaohongshu.com");
        await this.context.addCookies(cookies);
      } catch (err) {
        console.error("Error loading cookies:", err);
      }
    }
  }

  async _saveCookies() {
    const cookies = await this.context.cookies();
    fs.writeFileSync(this.cookiesFile, JSON.stringify(cookies));
  }

  async login(phone, verificationCode = "") {
    if (!this.browser) await this.init();

    // 加载cookies进行登录
    await this.page.goto("https://creator.xiaohongshu.com/login");
    await this._loadCookies();
    await this.page.reload();
    await this.page.waitForTimeout(3000);

    // 检查是否已经登录
    const currentUrl = this.page.url();
    if (currentUrl !== "https://creator.xiaohongshu.com/login") {
      await this._saveCookies();
      await this.page.waitForTimeout(2000);
      return;
    } else {
      // 清理无效的cookies
      await this.context.clearCookies();
    }

    // 如果cookies登录失败，则进行手动登录
    await this.page.goto("https://creator.xiaohongshu.com/login");

    // 等待登录页面加载完成
    await this.page.waitForTimeout(5000);

    // 定位手机号输入框
    const phoneInput = await this.page.waitForSelector('input[placeholder="手机号"]', { timeout: 10000 });
    await phoneInput.fill('');
    await phoneInput.fill(phone);

    // 如果验证码为空，则点击发送验证码按钮
    if (!verificationCode) {
      try {
        const sendCodeBtn = await this.page.waitForSelector(".css-uyobdj", { timeout: 10000 });
        await sendCodeBtn.click();
      } catch (e) {
        try {
          const sendCodeBtn = await this.page.waitForSelector(".css-1vfl29", { timeout: 10000 });
          await sendCodeBtn.click();
        } catch (e) {
          try {
            const sendCodeBtn = await this.page.waitForSelector("button:has-text('发送验证码')", { timeout: 10000 });
            await sendCodeBtn.click();
          } catch (e) {
            console.error("无法找到发送验证码按钮");
          }
        }
      }
      return {
        message: "验证码已发送，请将其配置到环境变量 verificationCode 中",
      };
    }

    // 输入验证码
    const codeInput = await this.page.waitForSelector('input[placeholder="验证码"]', { timeout: 10000 });
    await codeInput.fill('');
    await codeInput.fill(verificationCode);

    // 点击登录按钮
    const loginButton = await this.page.waitForSelector(".beer-login-btn", { timeout: 10000 });
    await loginButton.click();

    // 等待登录成功,保存cookies
    await this.page.waitForTimeout(3000);
    await this._saveCookies();
  }

  async postArticle(title, content, images = []) {
    // 点击发布按钮
    const publishBtn = await this.page.waitForSelector(".btn.el-tooltip__trigger.el-tooltip__trigger", { timeout: 10000 });
    await publishBtn.click();

    // 如果是发布图文，则切换到上传图文
    await this.page.waitForTimeout(2000);
    const tabs = await this.page.$$(".creator-tab");
    if (tabs.length > 1) {
      await tabs[1].click();
    }
    await this.page.waitForTimeout(2000);

    // 上传图片
    if (images.length > 0) {
      const uploadInput = await this.page.$(".upload-input");
      await uploadInput.setInputFiles(images);
      await this.page.waitForTimeout(1000);
    }
    await this.page.waitForTimeout(2000);

    // 输入标题 (限制为20字)
    title = title.substring(0, 20);
    const titleInput = await this.page.waitForSelector(".d-text", { timeout: 10000 });
    await titleInput.fill(title);

    // 输入内容
    const contentInput = await this.page.waitForSelector(".ql-editor", { timeout: 10000 });
    await contentInput.fill(content);

    // 发布
    await this.page.waitForTimeout(2000);
    const submitBtn = await this.page.$(".publishBtn");
    await submitBtn.click();

    await this.page.waitForTimeout(2000);
  }

  async postVideoArticle(title, content, videos = []) {
    // 点击发布按钮
    await this.page.waitForTimeout(3000);
    const publishBtn = await this.page.waitForSelector(".btn.el-tooltip__trigger.el-tooltip__trigger", { timeout: 10000 });
    await publishBtn.click();

    // 上传视频
    await this.page.waitForTimeout(3000);
    if (videos.length > 0) {
      const uploadInput = await this.page.$(".upload-input");
      await uploadInput.setInputFiles(videos);
      await this.page.waitForTimeout(1000);
    }
    await this.page.waitForTimeout(3000);

    // 输入标题
    const titleInput = await this.page.waitForSelector(".d-text", { timeout: 10000 });
    await titleInput.fill(title);

    // 输入内容
    const contentInput = await this.page.waitForSelector(".ql-editor", { timeout: 10000 });
    await contentInput.fill(content);

    // 发布
    await this.page.waitForTimeout(6000);
    const submitBtn = await this.page.$(".publishBtn");
    await submitBtn.click();

    await this.page.waitForTimeout(3000);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}
