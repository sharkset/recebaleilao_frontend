import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = user.id;
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
