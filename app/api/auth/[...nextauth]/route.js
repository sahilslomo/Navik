import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      // 🔥 This ensures query params like ?class=2 are preserved
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return url;
    },
  },
});

export { handler as GET, handler as POST };
