import { apiRoute, auth } from "@/api";
import { createRoute } from "@hono/zod-openapi";
import { Media } from "@versia/kit/db";
import { RolePermissions } from "@versia/kit/tables";
import { z } from "zod";
import { ApiError } from "~/classes/errors/api-error";
import { MediaManager } from "~/classes/media/media-manager";
import { config } from "~/packages/config-manager/index.ts";
import { ErrorSchema } from "~/types/api";

const schemas = {
    param: z.object({
        id: z.string().uuid(),
    }),
    form: z.object({
        thumbnail: z.instanceof(File).optional(),
        description: z
            .string()
            .max(config.validation.max_media_description_size)
            .optional(),
        focus: z.string().optional(),
    }),
};

const routePut = createRoute({
    method: "put",
    path: "/api/v1/media/{id}",
    summary: "Update media",
    middleware: [
        auth({
            auth: true,
            scopes: ["write:media"],
            permissions: [RolePermissions.ManageOwnMedia],
        }),
    ] as const,
    request: {
        params: schemas.param,
        body: {
            content: {
                "multipart/form-data": {
                    schema: schemas.form,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Media updated",
            content: {
                "application/json": {
                    schema: Media.schema,
                },
            },
        },

        404: {
            description: "Media not found",
            content: {
                "application/json": {
                    schema: ErrorSchema,
                },
            },
        },
    },
});

const routeGet = createRoute({
    method: "get",
    path: "/api/v1/media/{id}",
    summary: "Get media",
    middleware: [
        auth({
            auth: true,
            permissions: [RolePermissions.ManageOwnMedia],
        }),
    ] as const,
    request: {
        params: schemas.param,
    },
    responses: {
        200: {
            description: "Media",
            content: {
                "application/json": {
                    schema: Media.schema,
                },
            },
        },
        404: {
            description: "Media not found",
            content: {
                "application/json": {
                    schema: ErrorSchema,
                },
            },
        },
    },
});

export default apiRoute((app) => {
    app.openapi(routePut, async (context) => {
        const { id } = context.req.valid("param");

        const attachment = await Media.fromId(id);

        if (!attachment) {
            throw new ApiError(404, "Media not found");
        }

        const { description, thumbnail } = context.req.valid("form");

        let thumbnailUrl = attachment.data.thumbnailUrl;

        const mediaManager = new MediaManager(config);

        if (thumbnail) {
            const { path } = await mediaManager.addFile(thumbnail);
            thumbnailUrl = Media.getUrl(path);
        }

        const descriptionText = description || attachment.data.description;

        if (
            descriptionText !== attachment.data.description ||
            thumbnailUrl !== attachment.data.thumbnailUrl
        ) {
            await attachment.update({
                description: descriptionText,
                thumbnailUrl,
            });

            return context.json(attachment.toApi(), 200);
        }

        return context.json(attachment.toApi(), 200);
    });

    app.openapi(routeGet, async (context) => {
        const { id } = context.req.valid("param");

        const attachment = await Media.fromId(id);

        if (!attachment) {
            throw new ApiError(404, "Media not found");
        }

        return context.json(attachment.toApi(), 200);
    });
});
