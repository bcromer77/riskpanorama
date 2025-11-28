import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db"; // Ensure your DB connection is here
import { User } from "@/models/User"; 

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.log("NextAuth: User not found.");
            return null;
          }

          const isValidPassword = await user.comparePassword(credentials.password);

          if (!isValidPassword) {
            console.log("NextAuth: Invalid password.");
            return null;
          }

          // Return the necessary user details for the token/session
          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            organisationId: user.organisationId.toString(),
            credits: user.credits,
          };
          
        } catch (error) {
          console.error("NextAuth Authorization Error:", error);
          return null;
        }
      },
    }),
  ],
  
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organisationId = user.organisationId;
        token.credits = user.credits;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.organisationId = token.organisationId as string;
        session.user.credits = token.credits as number;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
