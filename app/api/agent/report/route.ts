// app/api/agent/report/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabases } from '@/lib/mongodb';
import { runAgenticOrchestration } from "@/lib/agentic_orchestrator";
import { ObjectId } from "mongodb";
import { ratelimit } from "@/lib/ratelimit";
import crypto from "crypto";

// Price Configuration — This is your golden goose
const AGENT_REPORT_COST = 5; // 5 credits = ~$25–$50 real money

/**
 * POST /api/agent/report
 * Premium Agentic RAG Intelligence — the most valuable endpoint in responsible minerals
 */
export async function POST(request: Request) {
    let session: any = null;
    const requestId = crypto.randomUUID();

    // 1. AUTH & TENANCY
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id || !authSession.user.organisationId) {
        return NextResponse.json(
            { error: "Authentication required." },
            { status: 401, headers: { "X-Request-ID": requestId } }
        );
    }

    const userId = authSession.user.id as string;
    const organisationId = authSession.user.organisationId as string;

    // 2. Rate Limiting — protect your most expensive endpoint
    const { success } = await ratelimit(1, "60 s").limit(`agent_report:${organisationId}`);
    if (!success) {
        return NextResponse.json(
            { error: "Too many Agentic requests. One per minute per organization." },
            { status: 429, headers: { "X-Request-ID": requestId } }
        );
    }

    try {
        const { query } = await request.json();
        if (!query || typeof query !== "string" || query.trim().length === 0) {
            return NextResponse.json(
                { error: "Valid query string is required." },
                { status: 400, headers: { "X-Request-ID": requestId } }
            );
        }

        const { dbIdentity, client } = await getDatabases();
        const dbUsers = dbIdentity.collection("users");
        const dbReports = dbIdentity.collection("agent_reports");
        const dbAudit = dbIdentity.collection("audit_trail");

        session = client.startSession();
        let userUpdate: any;
        let reportId: ObjectId;

        // 3. ATOMIC PHASE: Charge credits + create report record
        await session.withTransaction(async () => {
            // Deduct credits
            userUpdate = await dbUsers.findOneAndUpdate(
                { _id: new ObjectId(userId), credits: { $gte: AGENT_REPORT_COST } },
                { $inc: { credits: -AGENT_REPORT_COST } },
                { returnDocument: "after", session }
            );

            if (!userUpdate.value) {
                throw new Error("Insufficient credits for Agentic Report (Requires 5 credits).");
            }

            // Create report record (visible immediately in UI)
            const reportResult = await dbReports.insertOne({
                userId: new ObjectId(userId),
                organisationId: new ObjectId(organisationId),
                query: query.trim(),
                status: "processing",
                startedAt: new Date(),
                cost: AGENT_REPORT_COST,
                requestId,
                createdAt: new Date(),
            }, { session });

            reportId = reportResult.insertedId;

            // Audit trail
            await dbAudit.insertOne({
                event: "AGENTIC_REPORT_CHARGED",
                userId: new ObjectId(userId),
                organisationId: new ObjectId(organisationId),
                reportId,
                timestamp: new Date(),
                creditsBefore: userUpdate.value.credits + AGENT_REPORT_COST,
                creditsAfter: userUpdate.value.credits,
                cost: AGENT_REPORT_COST,
                query: query.trim(),
                requestId,
            }, { session });
        });

        // Transaction committed — money is secured, report is visible

        let report: any;

        try {
            // 4. HEAVY LIFTING — Run the actual Agentic RAG (outside transaction)
            report = await runAgenticOrchestration(query.trim(), organisationId);

            // 5. Mark report as completed
            await dbReports.updateOne(
                { _id: reportId },
                {
                    $set: {
                        status: "completed",
                        completedAt: new Date(),
                        report: report.report,
                        sources: {
                            internal: report.internalSources,
                            external: report.externalSources,
                        },
                        tokenUsage: report.tokenUsage || null,
                    },
                }
            );

            // Optional: success audit event
            await dbAudit.insertOne({
                event: "AGENTIC_REPORT_COMPLETED",
                reportId,
                userId: new ObjectId(userId),
                organisationId: new ObjectId(organisationId),
                timestamp: new Date(),
                requestId,
            });

        } catch (agentError: any) {
            // Even if LLM fails, user was already charged — mark as failed
            await dbReports.updateOne(
                { _id: reportId },
                {
                    $set: {
                        status: "failed",
                        failedAt: new Date(),
                        error: agentError.message || "Agentic orchestration failed",
                    },
                }
            );

            await dbAudit.insertOne({
                event: "AGENTIC_REPORT_FAILED",
                reportId,
                userId: new ObjectId(userId),
                organisationId: new ObjectId(organisationId),
                error: agentError.message,
                timestamp: new Date(),
                requestId,
            });

            throw agentError; // re-throw to trigger error response
        }

        // 6. SUCCESS — Return report + metadata
        return NextResponse.json({
            success: true,
            reportId: reportId.toString(),
            report: report.report,
            sources: {
                internal: report.internalSources,
                external: report.externalSources,
            },
            remainingCredits: userUpdate.value.credits,
            viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reports/${reportId}`,
        }, {
            status: 200,
            headers: { "X-Request-ID": requestId }
        });

    } catch (error: any) {
        if (session?.inTransaction()) await session.abortTransaction();

        const statusMap: Record<string, number> = {
            "Insufficient credits for Agentic Report (Requires 5 credits).": 402,
        };
        const status = statusMap[error.message] || 500;

        console.error("Agentic Report failed:", {
            requestId,
            error: error.message,
            stack: error.stack,
        });

        return NextResponse.json(
            { error: error.message || "Failed to generate Agentic report." },
            { status, headers: { "X-Request-ID": requestId } }
        );

    } finally {
        if (session) await session.endSession();
    }
}

export const dynamic = "force-dynamic";
