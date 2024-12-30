import { apiRoute, auth } from "@/api";
import { createRoute } from "@hono/zod-openapi";
import { User } from "@versia/kit/db";
import { RolePermissions } from "@versia/kit/tables";
import { z } from "zod";
import { ApiError } from "~/classes/errors/api-error";
import { ErrorSchema } from "~/types/api";

const route = createRoute({
    method: "get",
    path: "/api/v1/accounts/{id}",
    summary: "Get account data",
    description: "Gets the specified account data",
    middleware: [
        auth({
            auth: false,
            permissions: [RolePermissions.ViewAccounts],
        }),
    ] as const,
    request: {
        params: z.object({
            id: z.string().uuid(),
        }),
    },
    responses: {
        200: {
            description: "Account data",
            content: {
                "application/json": {
                    schema: User.schema,
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

        const foundUser = await User.fromId(id);

        if (!foundUser) {
            throw new ApiError(404, "User not found");
        }

        return context.json(foundUser.toApi(user?.id === foundUser.id), 200);
    }),
);
