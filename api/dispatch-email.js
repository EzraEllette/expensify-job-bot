const DISPATCH_TOKEN = process.env.DISPATCH_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_URL = "https://api.github.com/repos/Expensify/App";
export default async function POST(request) {
  console.log(request.headers)
  const authorization = request.headers.authorization;

  if (authorization !== `Bearer ${DISPATCH_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const issues = await getIssues();

  if (!issues.ok) {
    return new Response("Failed to fetch issues", { status: 500 });
  }

  return new Response(JSON.stringify(issues), { status: 200 });
}

async function getIssues() {
  const issues = await fetch(`${GITHUB_URL}/issues?labels=Help+Wanted`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: `application/vnd.github+json`,
    },
  });

  return await issues.json();
}
