/**
 * 联通Token获取工具 - Cloudflare Worker版本
 * 将Python Flask应用改写为Cloudflare Worker
 */

import forge from 'node-forge';
import { renderTemplate, generateColoredHtml } from './template';

// ==========================================
// 核心功能区
// ==========================================

// --- RSA 加密类 (联通官方登录必须，使用 PKCS1_v1_5 填充) ---
class RSAEncrypt {
  private publicKeyPEM: string;
  private maxBlockSize: number = 117;

  constructor() {
    // 联通官方公钥
    this.publicKeyPEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDc+CZK9bBA9IU+gZUOc6FUGu7y
O9WpTNB0PzmgFBh96Mg1WrovD1oqZ+eIF4LjvxKXGOdI79JRdve9NPhQo07+uqGQ
gE4imwNnRx7PFtCRryiIEcUoavuNtuRVoBAm6qdB0SrctgaqGfLgKvZHOnwTjyNq
jBUxzMeQlEC2czEMSwIDAQAB
-----END PUBLIC KEY-----`;
  }

  // RSA加密主函数 (使用 PKCS1_v1_5 填充，与 Python 版本一致)
  encrypt(plaintext: string, isPassword: boolean = false): { result: string; error: string | null } {
    try {
      if (isPassword) {
        plaintext = plaintext + "000000";
      }

      // 使用 node-forge 导入公钥
      const publicKey = forge.pki.publicKeyFromPem(this.publicKeyPEM);

      // 将明文转为字节
      const raw = forge.util.encodeUtf8(plaintext);

      // 分块加密
      const encryptedBlocks: string[] = [];
      for (let i = 0; i < raw.length; i += this.maxBlockSize) {
        const block = raw.slice(i, i + this.maxBlockSize);
        // 使用 PKCS1_v1_5 填充进行加密 (node-forge 默认)
        const encryptedBlock = publicKey.encrypt(block);
        encryptedBlocks.push(encryptedBlock);
      }

      // 合并所有加密块并转为 Base64
      const combined = encryptedBlocks.join('');
      const result = forge.util.encode64(combined);

      return {
        result: result,
        error: null
      };
    } catch (e: any) {
      return {
        result: "",
        error: e.message || String(e)
      };
    }
  }
}

// --- 联通登录逻辑 ---
class UnicomPwdLogin {
  private phone: string;
  private password: string;
  private rsa: RSAEncrypt;
  private appid: string;

  constructor(phone: string, password: string) {
    this.phone = phone;
    this.password = password;
    this.rsa = new RSAEncrypt();
    this.appid = this.generateAppId();
  }

  // 生成随机AppID
  private generateAppId(): string {
    const rand = () => Math.floor(Math.random() * 10);
    return `${rand()}f${rand()}af${rand()}${rand()}ad${rand()}912d306b5053abf90c7ebbb695887bc870ae0706d573c348539c26c5c0a878641fcc0d3e90acb9be1e6ef858a59af546f3c826988332376b7d18c8ea2398ee3a9c3db947e2471d32a49612`;
  }

  // MD5哈希 (使用 node-forge)
  private md5(text: string): string {
    const md = forge.md.md5.create();
    md.update(text);
    return md.digest().toHex();
  }

  // 登录函数
  async login(): Promise<any> {
    try {
      // 唯一的数据出口：联通官方服务器
      const url = "https://m.client.10010.com/mobileService/login.htm";
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const encMobile = this.rsa.encrypt(this.phone, false);
      const encPwd = this.rsa.encrypt(this.password, true);

      if (encMobile.error || encPwd.error) {
        return {
          status: "error",
          msg: `加密失败: ${encMobile.error || encPwd.error}`
        };
      }

      const headers = {
        "Host": "m.client.10010.com",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ChinaUnicom4.x/12.2 (com.chinaunicom.mobilebusiness; build:44; iOS 26.2) Alamofire/4.7.3 unicom{version:iphone_c@12.0200}",
      };

      const deviceId = this.md5(this.phone);

      const payload = new URLSearchParams({
        deviceOS: "26.2",
        mobile: encMobile.result,
        netWay: "wifi",
        deviceCode: deviceId,
        deviceId: deviceId,
        uniqueIdentifier: deviceId,
        version: "iphone_c@12.0200",
        password: encPwd.result,
        appId: this.appid,
        pip: "10.98.155.187",
        reqtime: timestamp,
        isRemberPwd: "false",
        keyVersion: "2"
      });

      // 发起请求
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload.toString()
      });

      const res = await response.json() as any;

      if (String(res.code) === "0" || String(res.code) === "0000") {
        return {
          status: "success",
          phone: this.phone,
          password: this.password,
          token_online: res.token_online || "",
          ecs_token: res.ecs_token || "",
          appid: this.appid
        };
      } else {
        return {
          status: "fail",
          msg: res.dsc || "未知错误"
        };
      }
    } catch (e: any) {
      return {
        status: "error",
        msg: e.message || String(e)
      };
    }
  }
}


// ==========================================
// Cloudflare Worker 主处理函数
// ==========================================

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 处理GET请求 - 显示表单
    if (request.method === 'GET') {
      return new Response(renderTemplate(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // 处理POST请求 - 处理登录
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;

        if (!phone || !password) {
          return new Response(renderTemplate({
            status: 'error',
            msg: '请输入手机号和密码'
          }), {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          });
        }

        const loginTool = new UnicomPwdLogin(phone, password);
        const res = await loginTool.login();

        if (res.status === 'success') {
          // 构造数据字符串（颜色顺序：蓝、红、绿、黄、紫）
          const parts = [
            String(res.phone),
            String(res.password),
            String(res.token_online),
            String(res.ecs_token),
            String(res.appid)
          ];
          const fullStr = parts.join('#');
          const coloredHtml = generateColoredHtml(parts);

          // 仅在内存中生成，不发送给任何第三方
          res.full_str = fullStr;
          res.colored_html = coloredHtml;
        }

        return new Response(renderTemplate(res), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      } catch (e: any) {
        return new Response(renderTemplate({
          status: 'error',
          msg: e.message || '处理请求时发生错误'
        }), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
    }

    // 其他请求方法返回405
    return new Response('Method Not Allowed', { status: 405 });
  },
};

