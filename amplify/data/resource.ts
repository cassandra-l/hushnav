/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Node: a
    .model({
      node_id: a.integer().required(),
      lat: a.float().required(),
      lon: a.float().required(),
    })
    .identifier(["node_id"]),

  Edge: a
    .model({
      edge_id: a.integer().required(),
      u: a.integer().required(),
      v: a.integer().required(),
      length: a.float().required(),
    })
    .identifier(["edge_id"]),

  NoiseSensor: a
    .model({
      device_id: a.string().required(),
      current_db: a.float(),
      last_updated: a.datetime(),
    })
    .identifier(["device_id"]),

  PedestrianSensor: a
    .model({
      location_id: a.integer().required(),
      current_count: a.integer(),
      observation_time: a.datetime(),
    })
    .identifier(["location_id"]),

  EdgeWeight: a
    .model({
      edge_id: a.integer().required(),
      final_cost: a.float(),
      noise_db: a.float(),
      is_high_noise: a.boolean(),
      observation_time: a.datetime(),
    })
    .identifier(["edge_id"]),
}).authorization((allow) => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
