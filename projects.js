// ============================================================
// HASSAN PORTFOLIO - PROJECTS PAGE
// ============================================================
//
// This file loads uploaded projects automatically from
// Firebase Firestore.
//
// Actual ZIP files are stored in GitHub.
//
// Upload architecture:
//
// Admin Panel
//      ↓
// Cloudflare Worker
//      ↓
// GitHub Repository (actual ZIP file)
//      ↓
// Firestore (project metadata)
//      ↓
// This Projects Page
//
// ============================================================


// ============================================================
// IMPORT FIREBASE DATABASE
// ============================================================

import {
    db
} from "./firebase-config.js";


// ============================================================
// IMPORT FIRESTORE FUNCTIONS
// ============================================================

import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const projectsGrid =
    document.getElementById("projectsGrid");


const projectsStatus =
    document.getElementById("projectsStatus");


const noProjectsMessage =
    document.getElementById("noProjectsMessage");


// ============================================================
// SECURITY: ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        String(value || "");


    return div.innerHTML;

}


// ============================================================
// GET PROJECT ICON
// ============================================================
//
// An icon is automatically selected according to the
// uploaded project name.
//

function getProjectIcon(projectName) {

    const name =
        String(projectName || "")
            .toLowerCase();


    if (
        name.includes("loan") ||
        name.includes("finance") ||
        name.includes("bank")
    ) {

        return "fa-solid fa-money-bill-trend-up";

    }


    if (
        name.includes("credit") ||
        name.includes("fraud")
    ) {

        return "fa-solid fa-credit-card";

    }


    if (
        name.includes("leaf") ||
        name.includes("plant") ||
        name.includes("disease")
    ) {

        return "fa-solid fa-leaf";

    }


    if (
        name.includes("sales") ||
        name.includes("forecast")
    ) {

        return "fa-solid fa-chart-line";

    }


    if (
        name.includes("climate") ||
        name.includes("weather") ||
        name.includes("environment")
    ) {

        return "fa-solid fa-earth-americas";

    }


    if (
        name.includes("news")
    ) {

        return "fa-solid fa-newspaper";

    }


    if (
        name.includes("customer") ||
        name.includes("churn")
    ) {

        return "fa-solid fa-users";

    }


    if (
        name.includes("drug") ||
        name.includes("molecule") ||
        name.includes("medical")
    ) {

        return "fa-solid fa-flask";

    }


    if (
        name.includes("moderation") ||
        name.includes("security")
    ) {

        return "fa-solid fa-shield-halved";

    }


    if (
        name.includes("titanic")
    ) {

        return "fa-solid fa-ship";

    }


    if (
        name.includes("code") ||
        name.includes("review")
    ) {

        return "fa-solid fa-code";

    }


    if (
        name.includes("chat") ||
        name.includes("language") ||
        name.includes("translation") ||
        name.includes("nlp")
    ) {

        return "fa-solid fa-language";

    }


    if (
        name.includes("ai") ||
        name.includes("artificial intelligence")
    ) {

        return "fa-solid fa-brain";

    }


    // --------------------------------------------------------
    // DEFAULT ICON
    // --------------------------------------------------------

    return "fa-solid fa-laptop-code";

}


// ============================================================
// PROJECT DESCRIPTION GENERATOR
// ============================================================

function getProjectDescription(projectName) {

    return `A professionally developed project titled "${projectName}" demonstrating practical skills in Artificial Intelligence, Machine Learning, Data Science, Software Development, and modern technologies.`;

}


// ============================================================
// PROJECT TAG GENERATOR
// ============================================================

function getProjectTags(projectName) {

    const name =
        String(projectName || "")
            .toLowerCase();


    const tags =
        ["Python"];


    // --------------------------------------------------------
    // ARTIFICIAL INTELLIGENCE
    // --------------------------------------------------------

    if (
        name.includes("ai") ||
        name.includes("artificial intelligence")
    ) {

        tags.push(
            "Artificial Intelligence"
        );

    }


    // --------------------------------------------------------
    // MACHINE LEARNING
    // --------------------------------------------------------

    if (
        name.includes("machine learning") ||
        name.includes("prediction") ||
        name.includes("predictor") ||
        name.includes("fraud") ||
        name.includes("churn") ||
        name.includes("loan") ||
        name.includes("titanic")
    ) {

        tags.push(
            "Machine Learning"
        );

    }


    // --------------------------------------------------------
    // DEEP LEARNING
    // --------------------------------------------------------

    if (
        name.includes("deep learning") ||
        name.includes("leaf") ||
        name.includes("image") ||
        name.includes("molecule")
    ) {

        tags.push(
            "Deep Learning"
        );

    }


    // --------------------------------------------------------
    // NLP
    // --------------------------------------------------------

    if (
        name.includes("nlp") ||
        name.includes("news") ||
        name.includes("text") ||
        name.includes("moderation") ||
        name.includes("chat") ||
        name.includes("translation")
    ) {

        tags.push("NLP");

    }


    // --------------------------------------------------------
    // DATA ANALYSIS
    // --------------------------------------------------------

    if (
        name.includes("forecast") ||
        name.includes("sales") ||
        name.includes("analysis")
    ) {

        tags.push(
            "Data Analysis"
        );

    }


    // --------------------------------------------------------
    // SOFTWARE DEVELOPMENT
    // --------------------------------------------------------

    if (
        name.includes("code") ||
        name.includes("software") ||
        name.includes("application") ||
        name.includes("system")
    ) {

        tags.push(
            "Software Development"
        );

    }


    // --------------------------------------------------------
    // DEFAULT TAG
    // --------------------------------------------------------

    if (tags.length === 1) {

        tags.push(
            "Software Project"
        );

    }


    // --------------------------------------------------------
    // REMOVE DUPLICATES
    // --------------------------------------------------------

    const uniqueTags =
        [...new Set(tags)];


    // Maximum four tags

    return uniqueTags.slice(0, 4);

}


// ============================================================
// CREATE PROJECT CARD
// ============================================================

function createProjectCard(
    project,
    index
) {

    // --------------------------------------------------------
    // PROJECT DATA
    // --------------------------------------------------------

    const projectName =
        project.name ||
        "Untitled Project";


    // Raw GitHub URL
    // Used for downloading the ZIP file.

    const downloadURL =
        project.fileURL ||
        "#";


    // GitHub file page URL
    // Used for viewing the uploaded file on GitHub.

    const githubURL =
        project.githubURL ||
        downloadURL;


    // --------------------------------------------------------
    // CREATE TAGS
    // --------------------------------------------------------

    const tags =
        getProjectTags(
            projectName
        );


    const tagsHTML =
        tags.map(

            (tag) => {

                return `
                    <span>
                        ${escapeHTML(tag)}
                    </span>
                `;

            }

        ).join("");


    // --------------------------------------------------------
    // CREATE CARD
    // --------------------------------------------------------

    const card =
        document.createElement("div");


    card.className =
        "project-card";


    card.innerHTML = `

        <div class="project-number">

            ${String(index + 1).padStart(2, "0")}

        </div>


        <div class="project-icon">

            <i class="${getProjectIcon(projectName)}"></i>

        </div>


        <h2>

            ${escapeHTML(projectName)}

        </h2>


        <p>

            ${escapeHTML(
                getProjectDescription(
                    projectName
                )
            )}

        </p>


        <div class="project-tags">

            ${tagsHTML}

        </div>


        <div class="project-buttons">


            <!-- DOWNLOAD ZIP -->

            <a
                href="${escapeHTML(downloadURL)}"
                target="_blank"
                rel="noopener noreferrer"
                class="project-btn">

                <i class="fa-solid fa-download"></i>

                Download Project

            </a>


            <!-- VIEW ON GITHUB -->

            <a
                href="${escapeHTML(githubURL)}"
                target="_blank"
                rel="noopener noreferrer"
                class="project-btn">

                <i class="fa-brands fa-github"></i>

                View on GitHub

            </a>


        </div>

    `;


    return card;

}


// ============================================================
// LOAD PROJECTS FROM FIRESTORE
// ============================================================

function loadProjects() {

    // --------------------------------------------------------
    // SHOW LOADING STATE
    // --------------------------------------------------------

    projectsStatus.style.display =
        "block";


    projectsStatus.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Loading projects...
    `;


    noProjectsMessage.style.display =
        "none";


    // --------------------------------------------------------
    // FIRESTORE QUERY
    // --------------------------------------------------------

    const projectsQuery =
        query(

            collection(
                db,
                "projects"
            ),

            orderBy(
                "createdAt",
                "desc"
            )

        );


    // ========================================================
    // REAL-TIME FIRESTORE LISTENER
    // ========================================================

    onSnapshot(

        projectsQuery,


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        (snapshot) => {

            console.log(
                "Projects loaded:",
                snapshot.size
            );


            // Clear existing cards

            projectsGrid.innerHTML =
                "";


            // ------------------------------------------------
            // EMPTY STATE
            // ------------------------------------------------

            if (snapshot.empty) {

                projectsStatus.style.display =
                    "none";


                noProjectsMessage.style.display =
                    "block";


                return;

            }


            // ------------------------------------------------
            // PROJECTS FOUND
            // ------------------------------------------------

            noProjectsMessage.style.display =
                "none";


            projectsStatus.style.display =
                "none";


            // ------------------------------------------------
            // CREATE PROJECT CARDS
            // ------------------------------------------------

            snapshot.forEach(

                (
                    docSnapshot,
                    index
                ) => {

                    const project =
                        docSnapshot.data();


                    console.log(
                        "Project:",
                        project
                    );


                    const projectCard =
                        createProjectCard(

                            project,
                            index

                        );


                    projectsGrid.appendChild(
                        projectCard
                    );

                }

            );

        },


        // ----------------------------------------------------
        // ERROR
        // ----------------------------------------------------

        (error) => {

            console.error(
                "Error loading projects:",
                error
            );


            projectsStatus.style.display =
                "block";


            noProjectsMessage.style.display =
                "none";


            projectsStatus.innerHTML = `

                <i class="fa-solid fa-triangle-exclamation"></i>

                Unable to load projects. Please try again later.

            `;

        }

    );

}


// ============================================================
// START PROJECT LOADING
// ============================================================

loadProjects();