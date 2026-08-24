// ============================================================
// IMPORT FIREBASE
// ============================================================

import {
    db
} from "./firebase-config.js";


// ============================================================
// FIRESTORE IMPORTS
// ============================================================

import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ============================================================
// CLOUDFLARE WORKER
// ============================================================

const WORKER_URL =
    "https://hassan-portfolio-worker.hassanshabbir1095.workers.dev";


// ============================================================
// GET ELEMENTS
// ============================================================

const certificatesList =
    document.getElementById(
        "certificatesList"
    );

const certificatesStatus =
    document.getElementById(
        "certificatesStatus"
    );

const noCertificatesMessage =
    document.getElementById(
        "noCertificatesMessage"
    );


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// ============================================================
// CREATE CERTIFICATE VIEWER URL
// ============================================================

function createCertificateViewerURL(
    storagePath
) {

    return (
        `certificate-viewer.html?path=` +
        `${encodeURIComponent(storagePath)}`
    );
}


// ============================================================
// CREATE CERTIFICATE CARD
// ============================================================

function createCertificateCard(
    certificate,
    index
) {

    const certificateName =
        certificate.name ||
        "Untitled Certificate";


    // --------------------------------------------------------
    // CERTIFICATE STORAGE PATH
    // --------------------------------------------------------

    const storagePath =
        certificate.storagePath ||
        "";


    // --------------------------------------------------------
    // VIEWER URL
    // --------------------------------------------------------

    const viewerURL =
        storagePath
            ? createCertificateViewerURL(
                storagePath
            )
            : "#";


    // --------------------------------------------------------
    // CREATE CARD
    // --------------------------------------------------------

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "certificate-card";


    // --------------------------------------------------------
    // CARD HTML
    // --------------------------------------------------------

    card.innerHTML = `

        <div class="certificate-number">

            ${String(index + 1).padStart(2, "0")}

        </div>


        <div class="certificate-icon">

            <i class="fa-solid fa-certificate"></i>

        </div>


        <div class="certificate-details">

            <h2>

                ${escapeHTML(
                    certificateName
                )}

            </h2>


            <p>

                This certificate represents a professional
                learning achievement and practical knowledge
                gained through continuous education and
                professional development.

            </p>


            <div class="certificate-buttons">

                <a
                    href="${escapeHTML(viewerURL)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn certificate-btn"
                >

                    <i class="fa-solid fa-eye"></i>

                    View Certificate

                </a>

            </div>

        </div>

    `;


    return card;
}


// ============================================================
// LOAD CERTIFICATES
// ============================================================

function loadCertificates() {

    certificatesStatus.style.display =
        "block";


    certificatesStatus.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Loading certificates...

    `;


    const certificatesQuery =
        query(
            collection(
                db,
                "certificates"
            ),

            orderBy(
                "createdAt",
                "desc"
            )
        );


    // ========================================================
    // REAL-TIME LISTENER
    // ========================================================

    onSnapshot(

        certificatesQuery,


        (snapshot) => {

            certificatesList.innerHTML =
                "";


            // ------------------------------------------------
            // EMPTY
            // ------------------------------------------------

            if (
                snapshot.empty
            ) {

                certificatesStatus.style.display =
                    "none";


                noCertificatesMessage.style.display =
                    "block";


                return;
            }


            // ------------------------------------------------
            // CERTIFICATES FOUND
            // ------------------------------------------------

            noCertificatesMessage.style.display =
                "none";


            certificatesStatus.style.display =
                "none";


            snapshot.forEach(

                (
                    docSnapshot,
                    index
                ) => {

                    const certificate =
                        docSnapshot.data();


                    const certificateCard =
                        createCertificateCard(
                            certificate,
                            index
                        );


                    certificatesList.appendChild(
                        certificateCard
                    );

                }

            );

        },


        // ====================================================
        // ERROR
        // ====================================================

        (error) => {

            console.error(
                "Error loading certificates:",
                error
            );


            certificatesStatus.style.display =
                "block";


            certificatesStatus.innerHTML = `

                <i class="fa-solid fa-triangle-exclamation"></i>

                Unable to load certificates.

            `;

        }

    );

}


// ============================================================
// START
// ============================================================

loadCertificates();