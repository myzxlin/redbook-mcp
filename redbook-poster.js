/**
 * 小红书自动发稿服务
 */
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import fs from "fs";
import path from "path";

export class RedbookPoster {
  constructor(jsonPath = "/tmp") {
    this.driver = new Builder()
      .forBrowser("chrome")
      .setChromeOptions(new chrome.Options())
      .build();
    this.cookiesFile = path.join(jsonPath, "redbook_cookies.json");
  }

  async _loadCookies() {
    if (fs.existsSync(this.cookiesFile)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(this.cookiesFile, "utf8"));
        await this.driver.get("https://creator.xiaohongshu.com");
        for (const cookie of cookies) {
          await this.driver.manage().addCookie(cookie);
        }
      } catch (err) {
        console.error("Error loading cookies:", err);
      }
    }
  }

  async _saveCookies() {
    const cookies = await this.driver.manage().getCookies();
    fs.writeFileSync(this.cookiesFile, JSON.stringify(cookies));
  }

  async login(phone, verificationCode = "") {
    // 加载cookies进行登录
    await this.driver.get("https://creator.xiaohongshu.com/login");
    await this._loadCookies();
    await this.driver.navigate().refresh();
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 检查是否已经登录
    const currentUrl = await this.driver.getCurrentUrl();
    if (currentUrl !== "https://creator.xiaohongshu.com/login") {
      await this._saveCookies();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return;
    } else {
      // 清理无效的cookies
      await this.driver.manage().deleteAllCookies();
    }

    // 如果cookies登录失败，则进行手动登录
    await this.driver.get("https://creator.xiaohongshu.com/login");

    // 等待登录页面加载完成
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 定位手机号输入框
    const phoneInput = await this.driver.wait(
      until.elementLocated(By.css('input[placeholder="手机号"]')),
      10000
    );
    await phoneInput.clear();
    await phoneInput.sendKeys(phone);

    // 如果验证码为空，则点击发送验证码按钮
    if (!verificationCode) {
      try {
        const sendCodeBtn = await this.driver.wait(
          until.elementLocated(By.css(".css-uyobdj")),
          10000
        );
        await sendCodeBtn.click();
      } catch (e) {
        try {
          const sendCodeBtn = await this.driver.wait(
            until.elementLocated(By.css(".css-1vfl29")),
            10000
          );
          await sendCodeBtn.click();
        } catch (e) {
          try {
            const sendCodeBtn = await this.driver.wait(
              until.elementLocated(
                By.xpath("//button[contains(text(),'发送验证码')]")
              ),
              10000
            );
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
    const codeInput = await this.driver.wait(
      until.elementLocated(By.css('input[placeholder="验证码"]')),
      10000
    );
    await codeInput.clear();
    await codeInput.sendKeys(verificationCode);

    // 点击登录按钮
    const loginButton = await this.driver.wait(
      until.elementLocated(By.css(".beer-login-btn")),
      10000
    );
    await loginButton.click();

    // 等待登录成功,获取cookies
    await new Promise((resolve) => setTimeout(resolve, 3000));
    // 保存cookies
    await this._saveCookies();
  }

  async postArticle(title, content, images = []) {
    // 点击发布按钮
    const publishBtn = await this.driver.wait(
      until.elementLocated(
        By.css(".btn.el-tooltip__trigger.el-tooltip__trigger")
      ),
      10000
    );
    await publishBtn.click();

    // 如果是发布图文，则切换到上传图文
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const tabs = await this.driver.findElements(By.css(".creator-tab"));
    if (tabs.length > 1) {
      await tabs[1].click();
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 上传图片
    if (images.length > 0) {
      const uploadInput = await this.driver.findElement(
        By.css(".upload-input")
      );
      await uploadInput.sendKeys(images.join("\n"));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 输入标题 (限制为20字)
    title = title.substring(0, 20);
    const titleInput = await this.driver.wait(
      until.elementLocated(By.css(".d-text")),
      10000
    );
    await titleInput.sendKeys(title);

    // 输入内容
    const contentInput = await this.driver.wait(
      until.elementLocated(By.css(".ql-editor")),
      10000
    );
    await contentInput.sendKeys(content);

    // 发布
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const submitBtn = await this.driver.findElement(By.css(".publishBtn"));
    await submitBtn.click();

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async postVideoArticle(title, content, videos = []) {
    // 点击发布按钮
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const publishBtn = await this.driver.wait(
      until.elementLocated(
        By.css(".btn.el-tooltip__trigger.el-tooltip__trigger")
      ),
      10000
    );
    await publishBtn.click();

    // 上传视频
    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (videos.length > 0) {
      const uploadInput = await this.driver.findElement(
        By.css(".upload-input")
      );
      await uploadInput.sendKeys(videos.join("\n"));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 输入标题
    const titleInput = await this.driver.wait(
      until.elementLocated(By.css(".d-text")),
      10000
    );
    await titleInput.sendKeys(title);

    // 输入内容
    const contentInput = await this.driver.wait(
      until.elementLocated(By.css(".ql-editor")),
      10000
    );
    await contentInput.sendKeys(content);

    // 发布
    await new Promise((resolve) => setTimeout(resolve, 6000));
    const submitBtn = await this.driver.findElement(By.css(".publishBtn"));
    await submitBtn.click();

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  async close() {
    await this.driver.quit();
  }
}
