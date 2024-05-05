import { createClient } from "@vercel/postgres";
import NodeMailer from "nodemailer";
import {
  DISPATCH_TOKEN,
  GITHUB_TOKEN,
  SMTP_PASSWORD,
  SMTP_SERVER_URL,
  SMTP_USERNAME,
} from "./constants.js";
const GITHUB_URL = "https://api.github.com/repos/Expensify/App";
const client = createClient();

interface Issue {
  id: number;
  shared: boolean;
  url: string;
  title: string;
}
export async function POST(
  request: Request,
  { waitUntil }: { waitUntil: (p: Promise<any>) => void }
) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${DISPATCH_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await client.connect();
  } catch (error: any) {
    return new Response("Failed to connect to database", { status: 500 });
  }

  const issues = await getIssues();

  if (issues.error) {
    return new Response("Failed to fetch issues", { status: 500 });
  }

  let { data: lastSentIssue, error: getLastSentIssueError } =
    await getLastSentIssue();

  if (getLastSentIssueError) {
    return new Response("Failed to get last sent issue", { status: 500 });
  }

  if (!lastSentIssue) {
    lastSentIssue = {
      id: issues.data[0].number - 1,
      shared: false,
      url: issues.data[0].url,
      title: issues.data[0].title,
    };
  }

  const newIssues: Issue[] = [];

  for (const issue of issues.data) {
    if (issue.number > lastSentIssue.id) {
      newIssues.push({
        id: issue.number,
        shared: false,
        url: issue.url,
        title: issue.title,
      });
    }
  }

  if (newIssues.length > 0) {
    const updateIssuesResult = await updateIssues(newIssues);

    if (updateIssuesResult.error) {
      return new Response("Failed to update issues", { status: 500 });
    }
  }

  const { data: unsharedIssues, error: getUnsharedIssuesError } =
    await getUnsharedIssues();

  if (getUnsharedIssuesError) {
    return new Response("Failed to fetch unshared issues", { status: 500 });
  }

  if (unsharedIssues.length === 0) {
    return new Response("No unshared issues to share", { status: 200 });
  }

  const { error: shareIssuesError } = await shareIssues(unsharedIssues);

  if (shareIssuesError) {
    return new Response("Failed to share issues", { status: 500 });
  }

  waitUntil(client.end());
  return new Response("Shared successfully", { status: 200 });
}

async function getIssues() {
  let issues;

  try {
    issues = await fetch(`${GITHUB_URL}/issues?labels=Help+Wanted`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: `application/vnd.github+json`,
      },
    });
  } catch (error: any) {
    return {
      data: null,
      error,
    };
  }

  return {
    data: await issues.json(),
    error: null,
  };
}

async function getLastSentIssue(): Promise<{
  data: Issue | null;
  error: Error | null;
}> {
  try {
    const { rows } = await client.sql`
    SELECT * FROM issues ORDER BY id DESC LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        data: null,
        error: null,
      };
    }

    return {
      data: rows[0] as Issue,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error,
    };
  }
}

async function updateIssues(issues: Issue[]): Promise<{
  error: Error | null;
}> {
  if (issues.length === 0) {
    return { error: null };
  }

  try {
    await client.query(
      `
      INSERT INTO issues (id, shared, url, title) SELECT id, false, url, title FROM json_populate_recordset(NULL::issues, $1)
      `,
      [JSON.stringify(issues)]
    );
  } catch (error: any) {
    return {
      error,
    };
  }

  return { error: null };
}

async function getUnsharedIssues(): Promise<{
  data: Issue[];
  error: Error | null;
}> {
  try {
    const { rows } = await client.sql`
    SELECT * FROM issues WHERE shared = false ORDER BY id ASC
    `;

    return {
      data: rows as Issue[],
      error: null,
    };
  } catch (error: any) {
    return {
      data: [],
      error: error,
    };
  }
}

async function shareIssues(issues: Issue[]): Promise<{
  error: Error | null;
}> {
  const { data: emailList, error: getEmailListError } = await getEmailList();

  if (getEmailListError) {
    return {
      error: getEmailListError,
    };
  }

  if (emailList.length === 0) {
    return { error: null };
  }

  const smtpClient = NodeMailer.createTransport({
    host: SMTP_SERVER_URL,
    secure: true,
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
  });

  for (const issue of issues) {
    // send the email
    try {
      await smtpClient.sendMail({
        from: `Expensify Job Bot <${SMTP_USERNAME}>`,
        bcc: emailList,
        subject: issue.title,
        text: `${issue.url}`,
        html: `${issue.url}`,
      });
    } catch (error: any) {
      return {
        error,
      };
    }

    try {
      await client.sql`
        UPDATE issues SET shared = true WHERE id = ${issue.id}
        `;
    } catch (error: any) {
      return {
        error,
      };
    }
  }

  return { error: null };
}

async function getEmailList(): Promise<{
  data: string[];
  error: Error | null;
}> {
  try {
    const { rows } = await client.sql`
    SELECT email FROM emails
    `;

    return {
      data: rows.map((row) => row.email),
      error: null,
    };
  } catch (error: any) {
    return {
      data: [],
      error,
    };
  }
}