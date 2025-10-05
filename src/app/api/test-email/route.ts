// import { NextResponse } from "next/server";
// import { sendEmail } from "@/lib/sendEmail";

// export async function GET() {
//   const success = await sendEmail(
//     "satyamyadav9uv@gmail.com",
//     "Test Email from Next.js",
//     "<h1>Hello!</h1><p>This is a test email sent via your Python API.</p>",
//   );

//   if (success) {
//     return NextResponse.json(
//       { message: "Email sent successfully" },
//       { status: 200 },
//     );
//   } else {
//     return NextResponse.json(
//       { message: "Failed to send email" },
//       { status: 500 },
//     );
//   }
// }
