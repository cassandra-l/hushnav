const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
};

export const handler = async (event: any) => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: '',
        };
    }

    const configuredPassword = process.env.LOCK_PASSWORD;

    if (!configuredPassword) {
        console.error("LOCK_PASSWORD is not set on the server.");
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ ok: false, error: "Password lock is not configured." }),
        };
    }

    const submittedPassword = JSON.parse(event.body).password;

    // password is required.
    if (!submittedPassword) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ ok: false, error: "Password is required." }),
        };
    }

    // reject invalid password.
    if (submittedPassword !== configuredPassword) {
        return {
            statusCode: 401,
            headers: CORS_HEADERS,
            body: JSON.stringify({ ok: false }),
        };
    }

    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: true }),
    }
}