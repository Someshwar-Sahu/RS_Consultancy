import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await db.user.findUnique({
                    where: { email: String(credentials.email) },
                    include: { companyContact: true },
                });

                if (!user || !user.passwordHash || !user.isActive) return null;

                if (user.role === "COMPANY_CONTACT" && user.companyContact && !user.companyContact.isApproved) {
                    throw new Error("Account pending Admin verification");
                }

                const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    companyBranchId: user.companyContact?.companyBranchId ?? null,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.companyBranchId = (user as any).companyBranchId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).companyBranchId = token.companyBranchId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
