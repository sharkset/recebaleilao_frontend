import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    session: {
        strategy: "jwt",
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            id: "email-otp",
            name: "Email OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                token: { label: "Código OTP", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.token) return null;

                try {
                    const res = await fetch(
                        `${process.env.BACKEND_URL}/api/auth/verify-otp`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                email: credentials.email,
                                token: credentials.token,
                            }),
                        }
                    );

                    const data = await res.json();

                    if (data.success && data.user) {
                        return {
                            id: data.user.id,
                            email: data.user.email,
                            name: data.user.name,
                            image: data.user.image ?? null,
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("OTP authorize error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
            }
            // Always fetch fresh role from DB so role changes reflect without re-login
            if (token.email) {
                try {
                    const client = await clientPromise;
                    const db = client.db();
                    const dbUser = await db.collection('users').findOne({ email: token.email });
                    token.role = dbUser?.role ?? 'common';
                } catch {
                    token.role = token.role ?? 'common';
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.picture as string | null;
                // @ts-ignore
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    events: {
        async createUser({ user }) {
            const client = await clientPromise;
            const db = client.db();
            await db.collection("subscriptions").insertOne({
                userId: user.id,
                plan: "free",
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        },
    },
    pages: {
        signIn: "/login",
    },
})
