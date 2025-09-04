// =================== VERY IMPORTANT ===================
//
//        将下面的 'YOUR_GITHUB_CLIENT_ID'
//      替换成你在 GitHub OAuth App 中设置的 Client ID
//
// ======================================================
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('github_token');

    const loggedInView = document.getElementById('logged-in-view');
    const loggedOutView = document.getElementById('logged-out-view');

    if (token) {
        try {
            const user = await getGitHubUser(token);
            document.getElementById('user-login').textContent = user.login;
            document.getElementById('user-avatar').src = user.avatar_url;
            loggedInView.classList.remove('hidden');
            loggedOutView.classList.add('hidden');
        } catch (error) {
            console.error("Token validation failed:", error);
            localStorage.removeItem('github_token');
            loggedInView.classList.add('hidden');
            loggedOutView.classList.remove('hidden');
        }
    } else {
        loggedInView.classList.add('hidden');
        loggedOutView.classList.remove('hidden');
    }
});

async function getGitHubUser(token) {
    const response = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${token}` }
    });
    if (!response.ok) {
        throw new Error('无法获取用户信息');
    }
    return await response.json();
}

document.getElementById('login-btn').addEventListener('click', () => {
    const scope = 'public_repo';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scope}`;
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('github_token');
    window.location.reload();
});

document.getElementById('bug-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const token = localStorage.getItem('github_token');
    if (!token) {
        alert("登录状态已失效，请重新登录。");
        window.location.reload();
        return;
    }

    const form = event.target;
    const title = form.elements.title.value;
    const body = form.elements.body.value;
    const submitBtn = document.getElementById('submit-btn');
    const responseMessage = document.getElementById('response-message');

    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    responseMessage.style.display = 'none';

    try {
        const response = await fetch('/api/submit-bug', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${token}`
            },
            body: JSON.stringify({ title, body }),
        });

        const result = await response.json();

        if (response.ok) {
            responseMessage.textContent = `反馈成功！感谢您。Issue 地址： ${result.issue_url}`;
            responseMessage.className = 'success';
            form.reset();
        } else {
            throw new Error(result.error || '提交失败，请稍后重试。');
        }
    } catch (error) {
        responseMessage.textContent = `出错了：${error.message}`;
        responseMessage.className = 'error';
    } finally {
        responseMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '提交反馈';
    }
});