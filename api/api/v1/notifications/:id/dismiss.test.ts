import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Notification as ApiNotification } from "@versia/client/types";
import { fakeRequest, getTestUsers } from "~/tests/utils";

const { users, tokens, deleteUsers } = await getTestUsers(2);
let notifications: ApiNotification[] = [];

// Create some test notifications: follow, favourite, reblog, mention
beforeAll(async () => {
    await fakeRequest(`/api/v1/accounts/${users[0].id}/follow`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${tokens[1].data.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });

    notifications = await fakeRequest("/api/v1/notifications", {
        headers: {
            Authorization: `Bearer ${tokens[0].data.accessToken}`,
        },
    }).then((r) => r.json());

    expect(notifications.length).toBe(1);
});

afterAll(async () => {
    await deleteUsers();
});

describe("/api/v1/notifications/:id/dismiss", () => {
    test("should return 401 if not authenticated", async () => {
        const response = await fakeRequest(
            `/api/v1/notifications/${notifications[0].id}/dismiss`,
            {
                method: "POST",
            },
        );

        expect(response.status).toBe(401);
    });

    test("should dismiss notification", async () => {
        const response = await fakeRequest(
            `/api/v1/notifications/${notifications[0].id}/dismiss`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${tokens[0].data.accessToken}`,
                },
            },
        );

        expect(response.status).toBe(200);
    });

    test("should not display dismissed notification", async () => {
        const response = await fakeRequest("/api/v1/notifications", {
            headers: {
                Authorization: `Bearer ${tokens[0].data.accessToken}`,
            },
        });

        expect(response.status).toBe(200);

        const output = await response.json();

        expect(output.length).toBe(0);
    });

    test("should not be able to dismiss other user's notifications", async () => {
        const response = await fakeRequest(
            `/api/v1/notifications/${notifications[0].id}/dismiss`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${tokens[1].data.accessToken}`,
                },
            },
        );

        expect(response.status).toBe(404);
    });
});
