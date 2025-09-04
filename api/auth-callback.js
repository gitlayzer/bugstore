export default async function handler(request, response) {
    // 只接受 POST 请求
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { code } = request.body;

    // 从 Vercel 环境变量中读取 OAuth App 的机密信息
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return response.status(400).json({ error: '缺少必要参数或服务器配置错误' });
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // 要求 GitHub 返回 JSON 格式
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
            response.status(200).json({ token: tokenData.access_token });
        } else {
            response.status(400).json({ error: tokenData.error_description || '无法从 GitHub 获取 Access Token' });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: '服务器内部错误' });
    }
}