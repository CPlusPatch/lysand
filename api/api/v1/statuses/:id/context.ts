import { apiRoute, auth, withNoteParam } from "@/api";
import { createRoute } from "@hono/zod-openapi";
import { Note } from "@versia/kit/db";
import { RolePermissions } from "@versia/kit/tables";
import { z } from "zod";
import { ErrorSchema } from "~/types/api";

const route = createRoute({
    method: "get",
    path: "/api/v1/statuses/{id}/context",
    middleware: [
        auth({
            auth: false,
            permissions: [RolePermissions.ViewNotes],
        }),
        withNoteParam,
    ] as const,
    summary: "Get status context",
    request: {
        params: z.object({
            id: z.string().uuid(),
        }),
    },
    responses: {
        200: {
            description: "Status context",
            content: {
                "application/json": {
                    schema: z.object({
                        ancestors: z.array(Note.schema),
                        descendants: z.array(Note.schema),
                    }),
                },
            },
        },
        404: {
            description: "Record not found",
            content: {
                "application/json": {
                    schema: ErrorSchema,
                },
            },
        },
    },
});

export default apiRoute((app) =>
    app.openapi(route, async (context) => {
        const { user } = context.get("auth");
        const note = context.get("note");

        const ancestors = await note.getAncestors(user ?? null);

        const descendants = await note.getDescendants(user ?? null);

        return context.json(
            {
                ancestors: await Promise.all(
                    ancestors.map((status) => status.toApi(user)),
                ),
                descendants: await Promise.all(
                    descendants.map((status) => status.toApi(user)),
                ),
            },
            200,
        );
    }),
);
