// ============================================================
// HASSAN PORTFOLIO
// SECURE CERTIFICATE VIEWER
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const WORKER_URL =
    "https://hassan-portfolio-worker.hassanshabbir1095.workers.dev";


// ============================================================
// GET ELEMENTS
// ============================================================

const statusElement =
    document.getElementById("status");

const certificatePages =
    document.getElementById("certificatePages");


// ============================================================
// GET CERTIFICATE PATH
// ============================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const storagePath =
    urlParams.get("path");


// ============================================================
// DISABLE COMMON DOWNLOAD / PRINT ACTIONS
// ============================================================

document.addEventListener(
    "contextmenu",
    function (event) {

        event.preventDefault();

    }
);


document.addEventListener(
    "dragstart",
    function (event) {

        event.preventDefault();

    }
);


// Disable common keyboard shortcuts.

document.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();

        const blocked =
            (
                event.ctrlKey &&
                (
                    key === "s" ||
                    key === "p" ||
                    key === "u"
                )
            )
            ||
            (
                event.ctrlKey &&
                event.shiftKey &&
                (
                    key === "i" ||
                    key === "j" ||
                    key === "c"
                )
            )
            ||
            key === "f12";


        if (blocked) {

            event.preventDefault();

            event.stopPropagation();

        }

    }
);


// ============================================================
// SHOW ERROR
// ============================================================

function showError(
    message
) {

    statusElement.innerHTML = `

        <i
            class="fa-solid fa-triangle-exclamation"
        ></i>

        <h2>
            Certificate unavailable
        </h2>

        <p>
            ${message}
        </p>

    `;

    statusElement.style.display =
        "flex";

}


// ============================================================
// LOAD PDF.JS
// ============================================================

async function loadPdfJS() {

    return await import(
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
    );

}


// ============================================================
// LOAD CERTIFICATE
// ============================================================

async function loadCertificate() {

    try {

        // ----------------------------------------------------
        // VALIDATE PATH
        // ----------------------------------------------------

        if (!storagePath) {

            throw new Error(
                "Certificate path is missing."
            );

        }


        if (
            !storagePath.startsWith(
                "certificates/"
            )
        ) {

            throw new Error(
                "Invalid certificate path."
            );

        }


        if (
            !storagePath
                .toLowerCase()
                .endsWith(".pdf")
        ) {

            throw new Error(
                "Invalid certificate file."
            );

        }


        // ----------------------------------------------------
        // SHOW LOADING
        // ----------------------------------------------------

        statusElement.style.display =
            "flex";

        statusElement.innerHTML = `

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            <h2>
                Loading certificate...
            </h2>

            <p>
                Please wait.
            </p>

        `;


        // ----------------------------------------------------
        // LOAD PDF.JS
        // ----------------------------------------------------

        const pdfjsLib =
            await loadPdfJS();


        // ----------------------------------------------------
        // CONFIGURE PDF.JS WORKER
        // ----------------------------------------------------

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";


        // ----------------------------------------------------
        // CREATE WORKER URL
        // ----------------------------------------------------

        const workerURL =
            new URL(
                "/certificate",
                WORKER_URL
            );


        workerURL.searchParams.set(
            "path",
            storagePath
        );


        // ----------------------------------------------------
        // FETCH PDF FROM CLOUDFLARE
        // ----------------------------------------------------

        const response =
            await fetch(
                workerURL.toString(),
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Certificate server returned ${response.status}.`
            );

        }


        // ----------------------------------------------------
        // READ PDF
        // ----------------------------------------------------

        const pdfArrayBuffer =
            await response.arrayBuffer();


        if (
            !pdfArrayBuffer ||
            pdfArrayBuffer.byteLength === 0
        ) {

            throw new Error(
                "The certificate file is empty."
            );

        }


        // ----------------------------------------------------
        // LOAD PDF DOCUMENT
        // ----------------------------------------------------

        const pdf =
            await pdfjsLib.getDocument(
                {
                    data:
                        pdfArrayBuffer,

                    disableAutoFetch:
                        false,

                    disableStream:
                        false
                }
            ).promise;


        // ----------------------------------------------------
        // CLEAR LOADING MESSAGE
        // ----------------------------------------------------

        statusElement.style.display =
            "none";

        certificatePages.innerHTML =
            "";


        // ----------------------------------------------------
        // RENDER EVERY PAGE
        // ----------------------------------------------------

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            await renderPage(
                pdf,
                pageNumber
            );

        }


        // ----------------------------------------------------
        // NO PAGES
        // ----------------------------------------------------

        if (
            pdf.numPages === 0
        ) {

            throw new Error(
                "The certificate contains no pages."
            );

        }

    }

    catch (error) {

        console.error(
            "Certificate viewer error:",
            error
        );


        statusElement.style.display =
            "flex";


        showError(
            error.message ||
            "Failed to load the certificate."
        );

    }

}


// ============================================================
// RENDER ONE PDF PAGE
// ============================================================

async function renderPage(
    pdf,
    pageNumber
) {

    const page =
        await pdf.getPage(
            pageNumber
        );


    // --------------------------------------------------------
    // DISPLAY SCALE
    // --------------------------------------------------------

    const baseViewport =
        page.getViewport(
            {
                scale: 1
            }
        );


    const containerWidth =
        Math.min(
            document.documentElement.clientWidth - 40,
            900
        );


    const scale =
        containerWidth /
        baseViewport.width;


    const viewport =
        page.getViewport(
            {
                scale:
                    Math.max(
                        scale,
                        0.5
                    )
            }
        );


    // --------------------------------------------------------
    // CREATE PAGE WRAPPER
    // --------------------------------------------------------

    const pageWrapper =
        document.createElement(
            "div"
        );


    pageWrapper.className =
        "certificate-page";


    pageWrapper.style.position =
        "relative";


    pageWrapper.style.width =
        `${viewport.width}px`;


    pageWrapper.style.maxWidth =
        "100%";


    pageWrapper.style.background =
        "#ffffff";


    pageWrapper.style.boxShadow =
        "0 15px 50px rgba(0,0,0,0.45)";


    pageWrapper.style.userSelect =
        "none";


    pageWrapper.style.webkitUserSelect =
        "none";


    pageWrapper.style.overflow =
        "hidden";


    // --------------------------------------------------------
    // CREATE CANVAS
    // --------------------------------------------------------

    const canvas =
        document.createElement(
            "canvas"
        );


    const context =
        canvas.getContext(
            "2d",
            {
                alpha: false
            }
        );


    const devicePixelRatio =
        Math.min(
            window.devicePixelRatio ||
            1,
            2
        );


    canvas.width =
        Math.floor(
            viewport.width *
            devicePixelRatio
        );


    canvas.height =
        Math.floor(
            viewport.height *
            devicePixelRatio
        );


    canvas.style.width =
        `${viewport.width}px`;


    canvas.style.height =
        `${viewport.height}px`;


    canvas.style.display =
        "block";


    canvas.style.maxWidth =
        "100%";


    canvas.style.height =
        "auto";


    canvas.style.userSelect =
        "none";


    canvas.style.webkitUserSelect =
        "none";


    canvas.style.webkitUserDrag =
        "none";


    canvas.draggable =
        false;


    // --------------------------------------------------------
    // SCALE CANVAS CONTEXT
    // --------------------------------------------------------

    context.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );


    // --------------------------------------------------------
    // ADD CANVAS
    // --------------------------------------------------------

    pageWrapper.appendChild(
        canvas
    );


    certificatePages.appendChild(
        pageWrapper
    );


    // --------------------------------------------------------
    // RENDER PDF PAGE
    // --------------------------------------------------------

    await page.render(
        {
            canvasContext:
                context,

            viewport:
                viewport
        }
    ).promise;

}


// ============================================================
// START VIEWER
// ============================================================

loadCertificate();