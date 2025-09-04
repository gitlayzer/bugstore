export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // 从请求头获取用户的 token
    const authHeader = request.headers.authorization;
    const userToken = authHeader?.split(' ')[1];

    if (!userToken) {
        return response.status(401).json({ error: '未授权：缺少 Token' });
    }

    const { title, body } = request.body;
    if (!title || !body) {
        return response.status(400).json({ error: '标题和内容不能为空' });
    }

    // 从 Vercel 环境变量中获取目标仓库
    const GITHUB_REPO = process.env.GITHUB_REPO;
    if (!GITHUB_REPO) {
        return response.status(500).json({ error: '服务器配置错误：未指定 GITHUB_REPO' });
    }

    const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/issues`;

    try {
        const githubResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                // 使用用户的 token 进行操作
                'Authorization': `token ${userToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                body: `${body}\n\n---\n*Submitted via bug reporter website.*`, // 附加额外信息
                labels: ['bug', 'from-website'] // 自动添加标签
            }),
        });

        const data = await githubResponse.json();

        if (githubResponse.status === 201) { // 201 Created
            response.status(200).json({
                message: 'Issue created successfully!',
                issue_url: data.html_url
            });
        } else {
            console.error('GitHub API Error:', data);
            response.status(githubResponse.status).json({ error: data.message || '无法在 GitHub 创建 Issue' });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: '服务器内部错误' });
    }
}