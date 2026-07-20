import postgres from "postgres";

const sql = postgres(process.env.DIRECT_URL);

async function check() {
  const columns = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name;
  `;
  console.log(JSON.stringify(columns, null, 2));
  await sql.end();
}

check().catch(console.error);
