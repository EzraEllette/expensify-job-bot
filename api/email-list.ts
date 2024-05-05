import * as EmailValidator from "email-validator";
import { sql } from "@vercel/postgres";

enum Operation {
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
}

export async function POST(request: Request) {
  const searchParams = new URL(request.url).searchParams;

  const email = searchParams.get("email") || ``;
  const operation = (searchParams.get("operation") as Operation) || ``;

  if (![Operation.SUBSCRIBE, Operation.UNSUBSCRIBE].includes(operation)) {
    return new Response(`Invalid operation: ${operation}`, { status: 400 });
  }

  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  if (!EmailValidator.validate(email)) {
    return new Response(`Invalid email: ${email}`, { status: 400 });
  }

  switch (operation) {
    case Operation.SUBSCRIBE:
      try {
        if (await emailExists(email)) {
          return new Response(`Email already in use: ${email}`, {
            status: 400,
          });
        }

        await sql`
        INSERT INTO emails (email) VALUES (${email})
        `;

        return new Response(`Subscribed: ${email}`, { status: 200 });
      } catch (error) {
        return new Response(`Failed to subscribe: ${email}`, { status: 500 });
      }

    case Operation.UNSUBSCRIBE:
      try {
        await sql`
        DELETE FROM emails WHERE email = ${email}
        `;

        return new Response(`Unsubscribed: ${email}`, { status: 200 });
      } catch (error) {
        return new Response(`Failed to unsubscribe: ${email}`, { status: 500 });
      }
  }
}

async function emailExists(email: string) {
  const { rows } = await sql`
    SELECT * FROM emails WHERE email = ${email}
  `;
  return rows.length > 0;
}
