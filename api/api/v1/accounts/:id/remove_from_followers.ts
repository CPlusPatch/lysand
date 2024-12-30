import { apiRoute, auth } from "@/api";
import { createRoute } from "@hono/zod-openapi";
import { Relationship, User } from "@versia/kit/db";
import { RolePermissions } from "@versia/kit/tables";
import { z } from "zod";
import { ApiError } from "~/classes/errors/api-error";
import { ErrorSchema } from "~/types/api";

const route = createRoute({
    method: "post",
    path: "/api/v1/accounts/{id}/remove_from_followers",
    summary: "Remove user from followers",
    description: "Remove a user from your followers",
    middleware: [
        auth({
            auth: true,
            scopes: ["write:follows"],
            permissions: [
                RolePermissions.ManageOwnFollows,
                RolePermissions.ViewAccounts,
            ],
        }),
    ] as const,
    request: {
        params: z.object({
            id: z.string().uuid(),
        }),
    },
    responses: {
        200: {
            description: "Updated relationship",
            content: {
                "application/json": {
                    schema: Relationship.schema,
                },
            },
        },
        404: {
            description: "User not found",
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
        const { id } = context.req.valid("param");
        const { user } = context.get("auth");

        const otherUser = await User.fromId(id);

        if (!otherUser) {
            throw new ApiError(404, "User not found");
        }

        const oppositeRelationship = await Relationship.fromOwnerAndSubject(
            otherUser,
            user,
        );

        if (oppositeRelationship.data.following) {
            await oppositeRelationship.update({
                following: false,
            });
        }

        const foundRelationship = await Relationship.fromOwnerAndSubject(
            user,
            otherUser,
        );

        return context.json(foundRelationship.toApi(), 200);
    }),
);
