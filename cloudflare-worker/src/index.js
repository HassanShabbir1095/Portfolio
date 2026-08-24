// ============================================================
// HASSAN PORTFOLIO - GITHUB FILE STORAGE WORKER
// ============================================================
//
// This Worker:
//
// 1. Uploads project ZIP files to GitHub.
// 2. Uploads certificate PDF files to GitHub.
// 3. Serves certificate PDFs through a controlled endpoint.
//
// GitHub token is NEVER exposed to the browser.
// It remains stored as a Cloudflare Worker secret.
//
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const GITHUB_OWNER =
    "HassanShabbir1095";

const GITHUB_REPOSITORY =
    "hassan-portfolio-files";

const GITHUB_BRANCH =
    "main";

const GITHUB_API_BASE =
    "https://api.github.com";

const GITHUB_RAW_BASE =
    "https://raw.githubusercontent.com";


// ============================================================
// CORS
// ============================================================

function getCorsHeaders(origin) {

    const allowedOrigins = [

        // Live GitHub Pages portfolio
        "https://hassanshabbir1095.github.io",

        // Local development
        "http://localhost:5500",
        "http://127.0.0.1:5500"

    ];


    const allowedOrigin =
        allowedOrigins.includes(origin)
            ? origin
            : allowedOrigins[0];


    return {

        "Access-Control-Allow-Origin":
            allowedOrigin,

        "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type",

        "Access-Control-Max-Age":
            "86400",

        "Vary":
            "Origin"

    };

}


// ============================================================
// JSON RESPONSE
// ============================================================

function jsonResponse(
    data,
    status,
    origin
) {

    return new Response(

        JSON.stringify(data),

        {

            status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                ...getCorsHeaders(origin)

            }

        }

    );

}


// ============================================================
// TEXT RESPONSE
// ============================================================

function textResponse(
    message,
    status,
    origin
) {

    return new Response(

        message,

        {

            status,

            headers: {

                "Content-Type":
                    "text/plain; charset=UTF-8",

                ...getCorsHeaders(origin)

            }

        }

    );

}


// ============================================================
// OPTIONS REQUEST
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

function sanitizeFileName(
    fileName
) {

    return fileName

        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )

        .replace(
            /_+/g,
            "_"
        )

        .replace(
            /^_+|_+$/g,
            ""
        )

        .slice(
            0,
            180
        );

}


// ============================================================
// CREATE PROJECT PATH
// ============================================================

function createProjectPath(
    fileName
) {

    const safeName =
        sanitizeFileName(fileName);


    const timestamp =
        Date.now();


    return (
        `projects/${timestamp}-${safeName}`
    );

}


// ============================================================
// CREATE CERTIFICATE PATH
// ============================================================

function createCertificatePath(
    fileName
) {

    const safeName =
        sanitizeFileName(fileName);


    const timestamp =
        Date.now();


    return (
        `certificates/${timestamp}-${safeName}`
    );

}


// ============================================================
// VALIDATE FILE
// ============================================================

function validateFile(
    file,
    type
) {

    if (!file) {

        return {

            valid: false,

            message:
                "No file was provided."

        };

    }


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
    // PROJECT
    // --------------------------------------------------------

    if (type === "project") {

        if (
            !fileName.endsWith(".zip")
        ) {

            return {

                valid: false,

                message:
                    "Project files must be ZIP files."

            };

        }

    }


    // --------------------------------------------------------
    // CERTIFICATE
    // --------------------------------------------------------

    if (type === "certificate") {

        if (
            !fileName.endsWith(".pdf")
        ) {

            return {

                valid: false,

                message:
                    "Certificate files must be PDF files."

            };

        }

    }


    return {

        valid: true

    };

}


// ============================================================
// GITHUB API UPLOAD
// ============================================================

async function uploadToGitHub(
    env,
    path,
    base64Content,
    commitMessage
) {

    const url =
        `${GITHUB_API_BASE}/repos/` +
        `${GITHUB_OWNER}/` +
        `${GITHUB_REPOSITORY}/` +
        `contents/${path}`;


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

                body:
                    JSON.stringify({

                        message:
                            commitMessage,

                        content:
                            base64Content,

                        branch:
                            GITHUB_BRANCH

                    })

            }

        );


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


    if (!response.ok) {

        console.error(
            "GitHub API error:",
            response.status,
            responseData
        );


        throw new Error(

            responseData.message ||
            `GitHub API returned ${response.status}`

        );

    }


    return responseData;

}


// ============================================================
// ARRAY BUFFER -> BASE64
// ============================================================

function arrayBufferToBase64(
    arrayBuffer
) {

    const bytes =
        new Uint8Array(
            arrayBuffer
        );


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
// VERIFY PDF FILE SIGNATURE
// ============================================================
//
// A real PDF begins with:
//
// %PDF-
//
// This is more reliable than checking GitHub's Content-Type
// header because GitHub Raw may return application/octet-stream.
//
// ============================================================

function isValidPdf(
    arrayBuffer
) {

    const bytes =
        new Uint8Array(
            arrayBuffer
        );


    // A PDF signature requires at least 5 bytes.
    if (
        bytes.length < 5
    ) {

        return false;

    }


    return (

        bytes[0] === 0x25 && // %
        bytes[1] === 0x50 && // P
        bytes[2] === 0x44 && // D
        bytes[3] === 0x46 && // F
        bytes[4] === 0x2D    // -

    );

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
    // CHECK GITHUB TOKEN
    // --------------------------------------------------------

    if (
        !env.GITHUB_TOKEN
    ) {

        throw new Error(
            "GitHub token is not configured in the Worker."
        );

    }


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
    // VALIDATE TYPE
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
    // FILE SIZE
    // --------------------------------------------------------

    const fileSize =
        file.size;


    const MAX_FILE_SIZE =
        90 * 1024 * 1024;


    if (
        fileSize >
        MAX_FILE_SIZE
    ) {

        return jsonResponse(

            {

                success: false,

                message:
                    "File is too large. " +
                    "Please keep portfolio files below 90 MB."

            },

            413,

            origin

        );

    }


    // --------------------------------------------------------
    // CONVERT FILE
    // --------------------------------------------------------

    const arrayBuffer =
        await file.arrayBuffer();


    // --------------------------------------------------------
    // EXTRA PDF VALIDATION
    // --------------------------------------------------------
    //
    // Check the actual uploaded file signature.
    //
    // --------------------------------------------------------

    if (
        type === "certificate" &&
        !isValidPdf(arrayBuffer)
    ) {

        return jsonResponse(

            {

                success: false,

                message:
                    "The uploaded certificate is not a valid PDF file."

            },

            415,

            origin

        );

    }


    const base64Content =
        arrayBufferToBase64(
            arrayBuffer
        );


    // --------------------------------------------------------
    // CREATE PATH
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
    // COMMIT MESSAGE
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
    // RAW GITHUB URL
    // --------------------------------------------------------

    const rawUrl =
        `${GITHUB_RAW_BASE}/` +
        `${GITHUB_OWNER}/` +
        `${GITHUB_REPOSITORY}/` +
        `${GITHUB_BRANCH}/` +
        `${path}`;


    // --------------------------------------------------------
    // GITHUB WEB URL
    // --------------------------------------------------------

    const githubUrl =
        `https://github.com/` +
        `${GITHUB_OWNER}/` +
        `${GITHUB_REPOSITORY}/blob/` +
        `${GITHUB_BRANCH}/` +
        `${path}`;


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return jsonResponse(

        {

            success: true,

            message:
                "File uploaded successfully.",

            type,

            fileName:
                file.name,

            fileSize,

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
// HANDLE CERTIFICATE VIEW
// ============================================================

async function handleCertificateView(
    request
) {

    const origin =
        request.headers.get("Origin") || "";


    const url =
        new URL(
            request.url
        );


    const path =
        url.searchParams.get(
            "path"
        );


    // --------------------------------------------------------
    // PATH REQUIRED
    // --------------------------------------------------------

    if (!path) {

        return textResponse(

            "Certificate path is required.",

            400,

            origin

        );

    }


    // --------------------------------------------------------
    // SECURITY VALIDATION
    // --------------------------------------------------------
    //
    // Only files matching:
    //
    // certificates/*.pdf
    //
    // are allowed.
    //
    // --------------------------------------------------------

    if (

        !path.startsWith(
            "certificates/"
        )

        ||

        !path.toLowerCase().endsWith(
            ".pdf"
        )

        ||

        path.includes(
            ".."
        )

        ||

        path.includes(
            "\\"
        )

        ||

        path.includes(
            "//"
        )

    ) {

        return textResponse(

            "Invalid certificate path.",

            400,

            origin

        );

    }


    // --------------------------------------------------------
    // CREATE GITHUB RAW URL
    // --------------------------------------------------------

    const githubURL =
        `${GITHUB_RAW_BASE}/` +
        `${GITHUB_OWNER}/` +
        `${GITHUB_REPOSITORY}/` +
        `${GITHUB_BRANCH}/` +
        `${path}`;


    console.log(
        "Loading certificate:",
        githubURL
    );


    // --------------------------------------------------------
    // FETCH FILE FROM GITHUB
    // --------------------------------------------------------

    const githubResponse =
        await fetch(

            githubURL,

            {

                headers: {

                    "Accept":
                        "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",

                    "User-Agent":
                        "hassan-portfolio-worker"

                }

            }

        );


    // --------------------------------------------------------
    // FILE NOT FOUND / GITHUB ERROR
    // --------------------------------------------------------

    if (
        !githubResponse.ok
    ) {

        console.error(
            "GitHub certificate fetch failed:",
            githubResponse.status,
            githubURL
        );


        return textResponse(

            `Certificate could not be found. GitHub returned ${githubResponse.status}.`,

            githubResponse.status,

            origin

        );

    }


    // --------------------------------------------------------
    // READ FILE BYTES
    // --------------------------------------------------------

    const pdfData =
        await githubResponse.arrayBuffer();


    // --------------------------------------------------------
    // VERIFY ACTUAL PDF SIGNATURE
    // --------------------------------------------------------
    //
    // Do NOT rely on GitHub's Content-Type.
    //
    // Verify the actual binary content instead.
    //
    // --------------------------------------------------------

    if (
        !isValidPdf(pdfData)
    ) {

        console.error(
            "GitHub returned a file that is not a valid PDF:",
            githubURL
        );


        return textResponse(

            "The requested certificate file is not a valid PDF.",

            415,

            origin

        );

    }


    // --------------------------------------------------------
    // RETURN PDF TO BROWSER
    // --------------------------------------------------------

    return new Response(

        pdfData,

        {

            status: 200,

            headers: {

                "Content-Type":
                    "application/pdf",

                "Content-Disposition":
                    "inline",

                "Content-Length":
                    String(pdfData.byteLength),

                "Cache-Control":
                    "public, max-age=3600",

                "X-Content-Type-Options":
                    "nosniff",

                ...getCorsHeaders(origin)

            }

        }

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
            request.headers.get(
                "Origin"
            ) || "";


        // ----------------------------------------------------
        // CORS PREFLIGHT
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

            url.pathname === "/"

            &&

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
        // CERTIFICATE VIEWER
        // ----------------------------------------------------

        if (

            url.pathname === "/certificate"

            &&

            request.method === "GET"

        ) {

            try {

                return await handleCertificateView(
                    request
                );

            } catch (error) {

                console.error(
                    "Certificate viewer error:",
                    error
                );


                return textResponse(

                    error.message ||
                    "Unable to load certificate.",

                    500,

                    origin

                );

            }

        }


        // ----------------------------------------------------
        // UPLOAD ENDPOINT
        // ----------------------------------------------------

        if (

            url.pathname === "/upload"

            &&

            request.method === "POST"

        ) {

            try {

                return await handleUpload(
                    request,
                    env
                );

            } catch (error) {

                console.error(
                    "Upload error:",
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