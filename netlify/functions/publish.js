// Checks the admin password server-side, then commits the updated content.json
// straight to the GitHub repo that Netlify deploys from. Netlify picks up the
// push and rebuilds automatically. The password never appears in any file here —
// it's read from a Netlify environment variable (Site settings > Environment
// variables > ADMIN_PASSWORD), so it's never visible in page source or the repo.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const { password, content } = body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { statusCode: 500, body: 'Server is missing ADMIN_PASSWORD configuration.' };
  }
  if (!password || password !== adminPassword) {
    return { statusCode: 401, body: 'Incorrect password.' };
  }
  if (!content || !content.site || !content.hero || !Array.isArray(content.listings)) {
    return { statusCode: 400, body: 'content.json is missing required sections.' };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "yourname/course-site"
  const branch = process.env.GITHUB_BRANCH || 'main';
  const path = process.env.CONTENT_PATH || 'content.json';

  if (!token || !repo) {
    return { statusCode: 500, body: 'Server is missing GITHUB_TOKEN / GITHUB_REPO configuration.' };
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'course-site-admin'
  };

  try {
    const currentRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
    if (!currentRes.ok) {
      const text = await currentRes.text();
      return { statusCode: 502, body: `Could not read current file from GitHub: ${text}` };
    }
    const current = await currentRes.json();

    const newContentBase64 = Buffer.from(JSON.stringify(content, null, 2) + '\n', 'utf-8').toString('base64');

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update site content via /admin',
        content: newContentBase64,
        sha: current.sha,
        branch
      })
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      return { statusCode: 502, body: `GitHub commit failed: ${text}` };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: `Unexpected error: ${err.message}` };
  }
};
