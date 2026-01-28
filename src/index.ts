import { fetchElliottophellia, fetchGitrecon1455, fetchHideipme, fetchTopChina, Proxy } from "./proxy-fetcher";

/**
 * 更新指定渠道的代理设置。
 * @param env - 包含 API URL 和凭证的环境变量。
 * @param proxyUrl - 要设置的新代理 URL。
 */
async function updateChannelProxy(env: Env, proxyUrl: string): Promise<void> {
	let channelIds
  try {
    channelIds = JSON.parse(env.CHANNEL_IDS) as number[];
  } catch (error) {
    throw new Error(`无效的 CHANNEL_IDS: ${env.CHANNEL_IDS}`);
  }
  const apiUrl = `${env.BASE_URL.replace(/\/$/, '')}/api/channel/`;
  
  for (const id of channelIds) {
    const updateData = {
      id,
      setting: JSON.stringify({ proxy: proxyUrl }),
    };
    console.log(`正在更新渠道 ${id} 的代理...`);
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'New-Api-User': env.ADMIN_ID,
        'Authorization': `Bearer ${env.ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  
    if (response.ok) {
      console.log("✅ 代理更新成功！");
    } else {
      const errorText = await response.text();
      console.error(`❌ 代理更新失败：HTTP ${response.status}: ${errorText}`);
      // 抛出错误以确保外层 catch 能够捕获到
      throw new Error(`代理更新失败：HTTP ${response.status}: ${errorText}`);
    }
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron Trigger 触发！开始执行任务：${event.cron}`);

    if (!env.BASE_URL || !env.ADMIN_ID || !env.ADMIN_TOKEN || !env.CHANNEL_IDS) {
      console.error("错误：一个或多个环境变量未设置 (BASE_URL, ADMIN_ID, ADMIN_TOKEN, CHANNEL_IDS)。请在 Cloudflare dashboard 或使用 wrangler secret 设置它们。");
      return; // 提前退出
    }

    try {
      let proxies: Proxy[];
      console.log("代理 IP 来源：", env.PROXY_SOURCE);
      switch (env.PROXY_SOURCE as string) {
        case 'TopChina/proxy-list':
          proxies = await fetchTopChina();
          break;
        case 'gitrecon1455/fresh-proxy-list':
          proxies = await fetchGitrecon1455();
          break;
        case 'zloi-user/hideip.me':
          proxies = await fetchHideipme();
          break;
        case 'elliottophellia/proxylist':
          proxies = await fetchElliottophellia();
          break;
        default:
          proxies = await fetchTopChina();
      }
      if (proxies.length === 0) {
        console.log("在列表中未找到有效的香港代理。任务结束。");
        return;
      }
      console.log(`找到了 ${proxies.length} 个香港代理。`);

      const firstProxy = proxies[0];
      const { type, ip, username, password } = firstProxy;
      const protocol = {"https": "http", "socks5": "socks5"}[type];
      let proxyUrl;
      if (username && password) {
        const encodedUser = encodeURIComponent(username);
        proxyUrl = `${protocol}://${encodedUser}:${password}@${ip}`;
      } else {
        proxyUrl = `${protocol}://${ip}`;
      }

      console.log(`准备使用代理：${proxyUrl}`);
      await updateChannelProxy(env, proxyUrl);
    } catch (error) {
      console.error("任务执行失败：", error instanceof Error ? error.message : String(error));
    }
  },
};
