// ============================================================
// HASSAN PORTFOLIO - GITHUB FILE STORAGE WORKER
// ============================================================
//
// This Cloudflare Worker receives files from the portfolio
// admin panel and uploads them securely to a GitHub repository.
//
// Supported files:
//   - ZIP project files
//   - PDF certificate files
//
// IMPORTANT:
// The GitHub token is NEVER exposed to the browser.
// It is stored securely as a Cloudflare Worker secret.
//
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const GITHUB_OWNER = "HassanShabbir1095";

const GITHUB_REPOSITORY = "hassan-portfolio-files";

const GITHUB_BRANCH = "main";

const GITHUB_API_BASE =
    "https://api.github.com";


// ============================================================
// CORS
// ============================================================
//
// IMPORTANT:
//
// Add your real GitHub Pages URL below.
//
// For example:
//
// https://hassanshabbir1095.github.io
//
// If your portfolio repository uses a project path, the Origin
// is STILL only:
//
// https://hassanshabbir1095.github.io
//
// NOT:
// https://hassanshabbir1095.github.io/repository-name
//
// ============================================================

const ALLOWED_ORIGINS = [

    // GitHub Pages portfolio
    "https://hassanshabbir1095.github.io",

    // Local development
    "http://localhost:5500",
    "http://127.0.0.1:5500"

];


// ============================================================
// GET CORS HEADERS
// ============================================================

function getCorsHeaders(origin) {

    // If the request comes from one of our allowed origins,
    // return that exact origin.

    const allowedOrigin =
        ALLOWED_ORIGINS.includes(origin)
            ? origin
            : ALLOWED_ORIGINS[0];


    return {

        "Access-Control-Allow-Origin":
            allowedOrigin,

        "Access-Control-Allow-Methods":
            "POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type",

        "Access-Control-Max-Age":
            "86400",

        "Vary":
            "Origin"

    };

}


// ============================================================
// CREATE JSON RESPONSE
// ============================================================

function jsonResponse(
    data,
    status = 200,
    origin = ""
) {

    return new Response(

        JSON.stringify(data),

        {

            status,

            headers: {

                "Content-Type":
                    "application/json",

                ...getCorsHeaders(origin)

            }

        }

    );

}


// ============================================================
// HANDLE OPTIONS REQUEST
// ============================================================

function handleOptions(request) {

    const origin =
        request.headers.get("Origin") || "";


    return new Response(

        null,

        {

            status: 204,

            headers:
                getCorsHeaders(origin)

        }

    );

}


// ============================================================
// SANITIZE FILE NAME
// ============================================================

function sanitizeFileName(fileName) {

    return fileName

        // Replace unsafe characters
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )

        // Replace multiple underscores
        .replace(
            /_+/g,
            "_"
        )

        // Remove underscores from beginning/end
        .replace(
            /^_+|_+$/g,
            ""
        )

        // Limit file name length
        .slice(0, 180);

}


// ============================================================
// CREATE PROJECT PATH
// ============================================================

function createProjectPath(fileName) {

    const safeName =
        sanitizeFileName(fileName);


    const timestamp =
        Date.now();


    return `projects/${timestamp}-${safeName}`;

}


// ============================================================
// CREATE CERTIFICATE PATH
// ============================================================

function createCertificatePath(fileName) {

    const safeName =
        sanitizeFileName(fileName);


    const timestamp =
        Date.now();


    return `certificates/${timestamp}-${safeName}`;

}


// ============================================================
// VALIDATE FILE
// ============================================================

function validateFile(
    file,
    type
) {

    // --------------------------------------------------------
    // CHECK FILE EXISTS
    // --------------------------------------------------------

    if (!file) {

        return {

            valid: false,

            message:
                "No file was provided."

        };

    }


    // --------------------------------------------------------
    // CHECK FILE NAME
    // --------------------------------------------------------

    if (!file.name) {

        return {

            valid: false,

            message:
                "File name is missing."

        };

    }


    const fileName =
        file.name.toLowerCase();


    // --------------------------------------------------------
    // VALIDATE PROJECT
    // --------------------------------------------------------

    if (type === "project") {

        if (!fileName.endsWith(".zip")) {

            return {

                valid: false,

                message:
                    "Project files must be ZIP files."

            };

        }

    }


    // --------------------------------------------------------
    // VALIDATE CERTIFICATE
    // --------------------------------------------------------

    if (type === "certificate") {

        if (!fileName.endsWith(".pdf")) {

            return {

                valid: false,

                message:
                    "Certificate files must be PDF files."

            };

        }

    }


    // --------------------------------------------------------
    // VALID
    // --------------------------------------------------------

    return {

        valid: true

    };

}


// ============================================================
// CONVERT ARRAY BUFFER TO BASE64
// ============================================================
//
// GitHub Contents API requires file content as Base64.
//
// ============================================================

function arrayBufferToBase64(arrayBuffer) {

    const bytes =
        new Uint8Array(arrayBuffer);


    const chunkSize =
        0x8000;


    let binary =
        "";


    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        const chunk =
            bytes.subarray(
                i,
                i + chunkSize
            );


        binary +=
            String.fromCharCode(
                ...chunk
            );

    }


    return btoa(binary);

}


// ============================================================
// UPLOAD FILE TO GITHUB
// ============================================================

async function uploadToGitHub(
    env,
    path,
    base64Content,
    commitMessage
) {

    // --------------------------------------------------------
    // CHECK GITHUB TOKEN
    // --------------------------------------------------------

    if (!env.GITHUB_TOKEN) {

        throw new Error(

            "GitHub token is not configured in the Cloudflare Worker."

        );

    }


    // --------------------------------------------------------
    // CREATE GITHUB CONTENTS API URL
    // --------------------------------------------------------

    const url =
        `${GITHUB_API_BASE}` +
        `/repos/${GITHUB_OWNER}` +
        `/${GITHUB_REPOSITORY}` +
        `/contents/${path}`;


    // --------------------------------------------------------
    // SEND FILE TO GITHUB
    // --------------------------------------------------------

    const response =
        await fetch(

            url,

            {

                method: "PUT",

                headers: {

                    "Accept":
                        "application/vnd.github+json",

                    "Authorization":
                        `Bearer ${env.GITHUB_TOKEN}`,

                    "X-GitHub-Api-Version":
                        "2022-11-28",

                    "User-Agent":
                        "hassan-portfolio-worker",

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    message:
                        commitMessage,

                    content:
                        base64Content,

                    branch:
                        GITHUB_BRANCH

                })

            }

        );


    // --------------------------------------------------------
    // READ RESPONSE
    // --------------------------------------------------------

    const responseText =
        await response.text();


    let responseData;


    try {

        responseData =
            JSON.parse(responseText);

    } catch {

        responseData = {

            message:
                responseText

        };

    }


    // --------------------------------------------------------
    // HANDLE GITHUB ERROR
    // --------------------------------------------------------

    if (!response.ok) {

        console.error(

            "GitHub API Error:",

            response.status,

            responseData

        );


        throw new Error(

            responseData.message ||
            `GitHub API returned HTTP ${response.status}`

        );

    }


    return responseData;

}


// ============================================================
// HANDLE FILE UPLOAD
// ============================================================

async function handleUpload(
    request,
    env
) {

    const origin =
        request.headers.get("Origin") || "";


    // --------------------------------------------------------
    // READ FORM DATA
    // --------------------------------------------------------

    const formData =
        await request.formData();


    const file =
        formData.get("file");


    const type =
        formData.get("type");


    // --------------------------------------------------------
    // VALIDATE UPLOAD TYPE
    // --------------------------------------------------------

    if (
        type !== "project" &&
        type !== "certificate"
    ) {

        return jsonResponse(

            {

                success: false,

                message:
                    "Invalid upload type."

            },

            400,

            origin

        );

    }


    // --------------------------------------------------------
    // VALIDATE FILE
    // --------------------------------------------------------

    const validation =
        validateFile(
            file,
            type
        );


    if (!validation.valid) {

        return jsonResponse(

            {

                success: false,

                message:
                    validation.message

            },

            400,

            origin

        );

    }


    // --------------------------------------------------------
    // FILE SIZE LIMIT
    // --------------------------------------------------------
    //
    // We use a conservative limit because the file must be
    // received by the Worker and Base64 encoded before sending
    // it to GitHub.
    //
    // Keep portfolio ZIP/PDF files reasonably small.
    //
    // ========================================================

    const MAX_FILE_SIZE =
        20 * 1024 * 1024;


    if (
        file.size >
        MAX_FILE_SIZE
    ) {

        return jsonResponse(

            {

                success: false,

                message:
                    "File is too large. " +
                    "Please keep each ZIP or PDF file below 20 MB."

            },

            413,

            origin

        );

    }


    // --------------------------------------------------------
    // READ FILE
    // --------------------------------------------------------

    const arrayBuffer =
        await file.arrayBuffer();


    // --------------------------------------------------------
    // CONVERT FILE TO BASE64
    // --------------------------------------------------------

    const base64Content =
        arrayBufferToBase64(
            arrayBuffer
        );


    // --------------------------------------------------------
    // CREATE STORAGE PATH
    // --------------------------------------------------------

    const path =
        type === "project"

            ? createProjectPath(
                file.name
            )

            : createCertificatePath(
                file.name
            );


    // --------------------------------------------------------
    // CREATE COMMIT MESSAGE
    // --------------------------------------------------------

    const commitMessage =
        type === "project"

            ? `Add portfolio project: ${file.name}`

            : `Add portfolio certificate: ${file.name}`;


    // --------------------------------------------------------
    // UPLOAD TO GITHUB
    // --------------------------------------------------------

    const githubResult =
        await uploadToGitHub(

            env,

            path,

            base64Content,

            commitMessage

        );


    // --------------------------------------------------------
    // CREATE RAW FILE URL
    // --------------------------------------------------------

    const rawUrl =
        `https://raw.githubusercontent.com/` +
        `${GITHUB_OWNER}/` +
        `${GITHUB_REPOSITORY}/` +
        `${GITHUB_BRANCH}/` +
        `${path}`;


    // --------------------------------------------------------
    // CREATE GITHUB FILE PAGE URL
    // --------------------------------------------------------

    const githubUrl =
        `https://github.com/` +
        `${GITHUB_OWNER}/` +
        `${GITHUB_REPOSITORY}/blob/` +
        `${GITHUB_BRANCH}/` +
        `${path}`;


    // --------------------------------------------------------
    // SUCCESS RESPONSE
    // --------------------------------------------------------

    return jsonResponse(

        {

            success: true,

            message:
                "File uploaded successfully.",

            type,

            fileName:
                file.name,

            fileSize:
                file.size,

            storagePath:
                path,

            fileURL:
                rawUrl,

            githubURL:
                githubUrl,

            commitSHA:
                githubResult.commit?.sha ||
                null

        },

        200,

        origin

    );

}


// ============================================================
// MAIN WORKER
// ============================================================

export default {

    async fetch(
        request,
        env
    ) {

        const url =
            new URL(
                request.url
            );


        const origin =
            request.headers.get("Origin") || "";


        // ----------------------------------------------------
        // HANDLE CORS PREFLIGHT
        // ----------------------------------------------------

        if (
            request.method === "OPTIONS"
        ) {

            return handleOptions(
                request
            );

        }


        // ----------------------------------------------------
        // HEALTH CHECK
        // ----------------------------------------------------

        if (
            url.pathname === "/" &&
            request.method === "GET"
        ) {

            return jsonResponse(

                {

                    success: true,

                    service:
                        "Hassan Portfolio File Upload API",

                    status:
                        "online"

                },

                200,

                origin

            );

        }


        // ----------------------------------------------------
        // UPLOAD ENDPOINT
        // ----------------------------------------------------

        if (
            url.pathname === "/upload" &&
            request.method === "POST"
        ) {

            try {

                return await handleUpload(
                    request,
                    env
                );

            } catch (error) {

                console.error(
                    "Upload Error:",
                    error
                );


                return jsonResponse(

                    {

                        success: false,

                        message:
                            error.message ||
                            "Upload failed."

                    },

                    500,

                    origin

                );

            }

        }


        // ----------------------------------------------------
        // NOT FOUND
        // ----------------------------------------------------

        return jsonResponse(

            {

                success: false,

                message:
                    "Endpoint not found."

            },

            404,

            origin

        );

    }

};