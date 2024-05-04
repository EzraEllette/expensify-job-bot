import * as EmailValidator from "email-validator";
import { sql } from "@vercel/postgres";

enum Operation {
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;

  const email = searchParams.get("email");
  const operation = searchParams.get("operation") as Operation;

  if (![Operation.SUBSCRIBE, Operation.UNSUBSCRIBE].includes(operation)) {
    return new Response(`Invalid operation: ${operation}`, { status: 400 });
  }

  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  if (!EmailValidator.validate(email)) {
    return new Response("Invalid email", { status: 400 });
  }

  if (await emailExists(email)) {
    return new Response("Email already in use", { status: 400 });
  }

  switch (operation) {
    case Operation.SUBSCRIBE:
      try {
        await sql`
        INSERT INTO emails (email) VALUES (${email})
        `;
      } catch (error) {
        return new Response("Failed to subscribe", { status: 500 });
      }
      break;
    case Operation.UNSUBSCRIBE:
      try {
        await sql`
        DELETE FROM emails WHERE email = ${email}
        `;
      } catch (error) {
        return new Response("Failed to unsubscribe", { status: 500 });
      }
  }
}

async function emailExists(email: string) {
  const { rows } = await sql`
    SELECT * FROM emails WHERE email = ${email}
  `;
  return rows.length > 0;
}
