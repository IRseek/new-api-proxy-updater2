export interface Proxy {
  type: 'https' | 'socks5',
  ip: string;
  password?: string;
  username?: string;
};

// --- --- --- --- --- ---

function extractHongKongProxies(markdownText: string): Proxy[] {
  const proxies: Proxy[] = [];
  const lines = markdownText.split('\n');
  const ipPortRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/;

  for (const line of lines) {
    // 检查是否为表格数据行
    if (line.startsWith('|') && !line.startsWith('|---')) {
      // 分割列并去除首尾空格
      const columns = line.split('|').map(col => col.trim()).filter(col => col);

      if (columns.length >= 3) {
        const ipPort = columns[0];
        const country = columns[1];
        const user = columns[2];

        // 筛选香港地区且 IP:端口 格式正确的代理
        if (country === "香港" && ipPortRegex.test(ipPort)) {
          proxies.push({ type: 'https', ip: ipPort, username: user, password: '1' });
        }
      }
    }
  }
  return proxies;
}

export async function fetchTopChina(): Promise<Proxy[]> {
  const response = await fetch("https://raw.githubusercontent.com/TopChina/proxy-list/refs/heads/main/README.md");
  if (!response.ok) {
    throw new Error(`获取代理列表失败，状态码：${response.status}`);
  }
  const markdownText = await response.text();
  console.log("成功获取代理列表 Markdown 文件。");
  const proxies = extractHongKongProxies(markdownText);
  return proxies;
}

// --- --- --- --- --- ---

export async function fetchGitrecon1455(): Promise<Proxy[]> {
  const response = await fetch("https://raw.githubusercontent.com/gitrecon1455/fresh-proxy-list/refs/heads/main/proxylist.json");
  if (!response.ok) {
    throw new Error(`获取代理列表失败，状态码：${response.status}`);
  }
  const proxyRawList = await response.json<{ ip: string, port: string, country_code: string, ssl: string, socks5: string }[]>();
  const result = proxyRawList
    .filter(item => item.country_code === "HK" && (item.ssl === "1" || item.socks5 === "1"))
    .map(item => {
      if (item.ssl === "1") {
        return { ip: `${item.ip}:${item.port}`, type: 'https' as const };
      } else if (item.socks5 === "1") {
        return { ip: `${item.ip}:${item.port}`, type: 'socks5' as const };
      } else {
        throw new Error("Unreachable code.");
      }
    });
  return result;
}

export async function fetchHideipme(): Promise<Proxy[]> {
  const response = await fetch("https://raw.githubusercontent.com/zloi-user/hideip.me/refs/heads/master/https.txt");
  if (!response.ok) {
    throw new Error(`获取代理列表失败，状态码：${response.status}`);
  }
  const proxyRawList = await response.text();
  const result = proxyRawList
    .split('\n')
    .map(line => {
      const [ip, port, location] = line.trim().split(':');
      return { ip, port, location };
    })
    .filter(item => item.location === "Hong Kong")
    .map(item => ({ ip: `${item.ip}:${item.port}`, type: 'https' as const }));
  return result;
}

export async function fetchElliottophellia(): Promise<Proxy[]> {
  const response = await fetch("https://raw.githubusercontent.com/elliottophellia/proxylist/refs/heads/master/results/socks5/country/HK/socks5_HK_checked.txt");
  if (!response.ok) {
    throw new Error(`获取代理列表失败，状态码：${response.status}`);
  }
  const proxyRawList = await response.text();
  const result = proxyRawList
    .split('\n')
    .map(line => {
      const [ip, port] = line.trim().split(':');
      return { ip, port };
    })
    .map(item => ({ ip: `${item.ip}:${item.port}`, type: 'socks5' as const }));
  return result;
}
