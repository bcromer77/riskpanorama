// lib/auth.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDatabases } from "@/lib/mongodb";
import { initializeIdentityModels } from "@/models/index";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt", 
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // 1. Get the identity database connection
        const { dbIdentity } = await getDatabases();
        // 2. Initialize the Mongoose User Model
        const { User } = await initializeIdentityModels(dbIdentity);

        const user = await User.findOne({ email: credentials.email });

        if (!user) return null;

        // Use the custom Mongoose method for secure comparison
        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) return null;

        // Return core user data for the JWT
        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role, 
          organisationId: user.organisationId.toString(), 
          credits: user.credits, 
        };
      },
    }),
  ],
  callbacks: {
    // 1. JWT Callback: Add custom fields to the token payload
    async jwt({ token, user }) {
      if (user) {
        // user is the return value of authorize()
        token.role = user.role;
        token.organisationId = user.organisationId;
        token.credits = user.credits;
      }
      return token;
    },
    // 2. Session Callback: Expose custom fields to the client session
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.organisationId = token.organisationId as string;
        session.user.credits = token.credits as number;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
