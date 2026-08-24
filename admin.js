// ============================================================
// HASSAN PORTFOLIO - ADMIN PANEL
// ============================================================
//
// Uses:
//   - Firebase Authentication
//   - Cloud Firestore
//   - Cloudflare Worker
//   - GitHub repository file storage
//
// Files:
//   Projects     → ZIP
//   Certificates → PDF
//
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

import {
    auth,
    db
} from "./firebase-config.js";


// ============================================================
// FIREBASE AUTH IMPORTS
// ============================================================

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


// ============================================================
// FIRESTORE IMPORTS
// ============================================================

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ============================================================
// ADMIN CONFIGURATION
// ============================================================

const ADMIN_EMAIL =
    "hassanshabbir1095@gmail.com";


// ============================================================
// CLOUDFLARE WORKER CONFIGURATION
// ============================================================

const UPLOAD_API_URL =
    "https://hassan-portfolio-worker.hassanshabbir1095.workers.dev/upload";


// ============================================================
// GET PAGE ELEMENTS
// ============================================================

const loginSection =
    document.getElementById("loginSection");

const adminControls =
    document.getElementById("adminControls");

const loginBtn =
    document.getElementById("loginBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");

const togglePasswordBtn =
    document.getElementById("togglePasswordBtn");

const togglePasswordIcon =
    document.getElementById("togglePasswordIcon");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginMessage =
    document.getElementById("loginMessage");

const adminStatus =
    document.getElementById("adminStatus");


// ============================================================
// FILE ELEMENTS
// ============================================================

const projectFileInput =
    document.getElementById("projectFile");

const certificateFileInput =
    document.getElementById("certificateFile");

const projectSelectedFile =
    document.getElementById("projectSelectedFile");

const certificateSelectedFile =
    document.getElementById("certificateSelectedFile");

const uploadProjectBtn =
    document.getElementById("uploadProjectBtn");

const uploadCertificateBtn =
    document.getElementById("uploadCertificateBtn");

const projectUploadStatus =
    document.getElementById("projectUploadStatus");

const certificateUploadStatus =
    document.getElementById("certificateUploadStatus");


// ============================================================
// HELPER FUNCTION
// ============================================================

function setMessage(
    element,
    message,
    type = ""
) {

    element.textContent =
        message;

    element.className =
        "admin-message";

    if (type) {

        element.classList.add(type);

    }

}


// ============================================================
// PASSWORD SHOW / HIDE
// ============================================================

togglePasswordBtn.addEventListener(
    "click",
    () => {

        if (
            passwordInput.type === "password"
        ) {

            passwordInput.type =
                "text";

            togglePasswordIcon.className =
                "fa-solid fa-eye-slash";

            togglePasswordBtn.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type =
                "password";

            togglePasswordIcon.className =
                "fa-solid fa-eye";

            togglePasswordBtn.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    }
);


// ============================================================
// LOGIN FUNCTION
// ============================================================

async function loginAdmin() {

    const email =
        emailInput.value
            .trim()
            .toLowerCase();

    const password =
        passwordInput.value;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!email || !password) {

        setMessage(
            loginMessage,
            "Please enter your email and password.",
            "error-message"
        );

        return;

    }


    // --------------------------------------------------------
    // ADMIN EMAIL CHECK
    // --------------------------------------------------------

    if (
        email !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        setMessage(
            loginMessage,
            "This email is not authorized to access the admin panel.",
            "error-message"
        );

        return;

    }


    try {

        // ----------------------------------------------------
        // LOADING STATE
        // ----------------------------------------------------

        loginBtn.disabled =
            true;

        loginBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Logging in...
        `;


        setMessage(
            loginMessage,
            "Signing in..."
        );


        // ----------------------------------------------------
        // FIREBASE LOGIN
        // ----------------------------------------------------

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        console.log(
            "Firebase login successful:",
            userCredential.user
        );


        setMessage(
            loginMessage,
            "Login successful.",
            "success-message"
        );


    } catch (error) {

        console.error(
            "Firebase Login Error:",
            error.code,
            error.message
        );


        let errorMessage =
            "Login failed. Please try again.";


        switch (error.code) {

            case "auth/invalid-credential":

                errorMessage =
                    "Incorrect email or password.";

                break;


            case "auth/user-not-found":

                errorMessage =
                    "No Firebase account was found with this email.";

                break;


            case "auth/wrong-password":

                errorMessage =
                    "The password is incorrect.";

                break;


            case "auth/invalid-email":

                errorMessage =
                    "The email address is not valid.";

                break;


            case "auth/user-disabled":

                errorMessage =
                    "This Firebase account has been disabled.";

                break;


            case "auth/too-many-requests":

                errorMessage =
                    "Too many unsuccessful attempts. Please wait before trying again.";

                break;


            case "auth/network-request-failed":

                errorMessage =
                    "Network error. Please check your internet connection.";

                break;


            case "auth/operation-not-allowed":

                errorMessage =
                    "Email/Password Authentication is not enabled in Firebase.";

                break;


            default:

                errorMessage =
                    `Login failed: ${error.code}`;

        }


        setMessage(
            loginMessage,
            errorMessage,
            "error-message"
        );


    } finally {

        // ----------------------------------------------------
        // RESTORE BUTTON
        // ----------------------------------------------------

        loginBtn.disabled =
            false;

        loginBtn.innerHTML = `
            <i class="fa-solid fa-right-to-bracket"></i>
            <span>Login</span>
        `;

    }

}


// ============================================================
// LOGIN BUTTON
// ============================================================

loginBtn.addEventListener(
    "click",
    loginAdmin
);


// ============================================================
// ENTER KEY LOGIN
// ============================================================

emailInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            loginAdmin();

        }

    }
);


passwordInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            loginAdmin();

        }

    }
);


// ============================================================
// FORGOT PASSWORD
// ============================================================

forgotPasswordBtn.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        // ----------------------------------------------------
        // CHECK EMAIL
        // ----------------------------------------------------

        if (!email) {

            setMessage(
                loginMessage,
                "Enter your admin email first, then click Forgot Password.",
                "error-message"
            );

            emailInput.focus();

            return;

        }


        // ----------------------------------------------------
        // ADMIN CHECK
        // ----------------------------------------------------

        if (
            email !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            setMessage(
                loginMessage,
                "Password reset is only available for the authorized admin email.",
                "error-message"
            );

            return;

        }


        try {

            forgotPasswordBtn.disabled =
                true;

            forgotPasswordBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Sending reset email...
            `;


            await sendPasswordResetEmail(
                auth,
                email
            );


            setMessage(
                loginMessage,
                "Password reset email sent. Check your Inbox and Spam folder.",
                "success-message"
            );


        } catch (error) {

            console.error(
                "Password Reset Error:",
                error.code,
                error.message
            );


            let errorMessage =
                "Unable to send the password reset email.";


            switch (error.code) {

                case "auth/invalid-email":

                    errorMessage =
                        "The email address is not valid.";

                    break;


                case "auth/user-not-found":

                    errorMessage =
                        "No Firebase account was found with this email.";

                    break;


                case "auth/too-many-requests":

                    errorMessage =
                        "Too many requests. Please wait before trying again.";

                    break;


                case "auth/network-request-failed":

                    errorMessage =
                        "Network error. Please check your internet connection.";

                    break;


                default:

                    errorMessage =
                        `Password reset failed: ${error.code}`;

            }


            setMessage(
                loginMessage,
                errorMessage,
                "error-message"
            );


        } finally {

            forgotPasswordBtn.disabled =
                false;

            forgotPasswordBtn.innerHTML = `
                <i class="fa-solid fa-unlock-keyhole"></i>
                Forgot Password?
            `;

        }

    }
);


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (
            user &&
            user.email &&
            user.email.toLowerCase() ===
            ADMIN_EMAIL.toLowerCase()
        ) {

            console.log(
                "Authorized admin logged in:",
                user.email
            );


            loginSection.style.display =
                "none";

            adminControls.style.display =
                "block";


            adminStatus.textContent =
                `Logged in as ${user.email}`;

            adminStatus.className =
                "admin-status logged-in-status";


        } else {

            loginSection.style.display =
                "block";

            adminControls.style.display =
                "none";


            if (user) {

                console.warn(
                    "Unauthorized account attempted access:",
                    user.email
                );


                adminStatus.textContent =
                    "Unauthorized account.";

                adminStatus.className =
                    "admin-status error-status";


                await signOut(auth);


            } else {

                adminStatus.textContent =
                    "Please login to access the admin dashboard.";

                adminStatus.className =
                    "admin-status";

            }

        }

    }
);


// ============================================================
// LOGOUT
// ============================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            passwordInput.value =
                "";

            setMessage(
                loginMessage,
                ""
            );


            console.log(
                "Admin logged out successfully."
            );


        } catch (error) {

            console.error(
                "Logout Error:",
                error.code,
                error.message
            );

        }

    }
);


// ============================================================
// PROJECT FILE SELECTION
// ============================================================

projectFileInput.addEventListener(
    "change",
    () => {

        const file =
            projectFileInput.files[0];


        if (file) {

            projectSelectedFile.textContent =
                `Selected: ${file.name}`;

        } else {

            projectSelectedFile.textContent =
                "No project selected.";

        }

    }
);


// ============================================================
// CERTIFICATE FILE SELECTION
// ============================================================

certificateFileInput.addEventListener(
    "change",
    () => {

        const file =
            certificateFileInput.files[0];


        if (file) {

            certificateSelectedFile.textContent =
                `Selected: ${file.name}`;

        } else {

            certificateSelectedFile.textContent =
                "No certificate selected.";

        }

    }
);


// ============================================================
// UPLOAD FILE TO WORKER
// ============================================================

async function uploadFileToWorker(
    file,
    type
) {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "type",
        type
    );


    const response =
        await fetch(

            UPLOAD_API_URL,

            {

                method:
                    "POST",

                body:
                    formData

            }

        );


    // --------------------------------------------------------
    // READ RESPONSE
    // --------------------------------------------------------

    let result;


    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            "The upload server returned an invalid response."
        );

    }


    // --------------------------------------------------------
    // HANDLE ERROR
    // --------------------------------------------------------

    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(

            result.message ||
            "File upload failed."

        );

    }


    return result;

}


// ============================================================
// CREATE CLEAN DISPLAY NAME
// ============================================================

function createDisplayName(
    fileName,
    extension
) {

    return fileName

        .replace(
            new RegExp(
                `\\.${extension}$`,
                "i"
            ),
            ""
        )

        .replace(
            /[-_]/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


// ============================================================
// PROJECT UPLOAD
// ============================================================

uploadProjectBtn.addEventListener(
    "click",
    async () => {

        const file =
            projectFileInput.files[0];


        // ----------------------------------------------------
        // FILE VALIDATION
        // ----------------------------------------------------

        if (!file) {

            setMessage(
                projectUploadStatus,
                "Please select a ZIP project first.",
                "error-message"
            );

            return;

        }


        if (
            !file.name
                .toLowerCase()
                .endsWith(".zip")
        ) {

            setMessage(
                projectUploadStatus,
                "Project must be a ZIP file.",
                "error-message"
            );

            return;

        }


        try {

            // ------------------------------------------------
            // LOADING STATE
            // ------------------------------------------------

            uploadProjectBtn.disabled =
                true;

            uploadProjectBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Uploading...</span>
            `;


            setMessage(
                projectUploadStatus,
                "Uploading project securely..."
            );


            // ------------------------------------------------
            // CREATE PROJECT NAME
            // ------------------------------------------------

            const projectName =
                createDisplayName(
                    file.name,
                    "zip"
                );


            // ------------------------------------------------
            // UPLOAD TO CLOUDFLARE WORKER
            // ------------------------------------------------

            const uploadResult =
                await uploadFileToWorker(
                    file,
                    "project"
                );


            // ------------------------------------------------
            // SAVE METADATA TO FIRESTORE
            // ------------------------------------------------

            setMessage(
                projectUploadStatus,
                "Saving project information..."
            );


            await addDoc(

                collection(
                    db,
                    "projects"
                ),

                {

                    name:
                        projectName,

                    originalFileName:
                        file.name,

                    fileURL:
                        uploadResult.fileURL,

                    githubURL:
                        uploadResult.githubURL,

                    storagePath:
                        uploadResult.storagePath,

                    fileSize:
                        uploadResult.fileSize,

                    uploadedBy:
                        auth.currentUser.email,

                    createdAt:
                        serverTimestamp()

                }

            );


            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            setMessage(
                projectUploadStatus,
                `Project "${projectName}" uploaded successfully.`,
                "success-message"
            );


            console.log(
                "Project upload successful:",
                uploadResult
            );


            // ------------------------------------------------
            // RESET INPUT
            // ------------------------------------------------

            projectFileInput.value =
                "";

            projectSelectedFile.textContent =
                "No project selected.";


        } catch (error) {

            console.error(
                "Project Upload Error:",
                error
            );


            setMessage(
                projectUploadStatus,
                `Project upload failed: ${error.message}`,
                "error-message"
            );


        } finally {

            uploadProjectBtn.disabled =
                false;

            uploadProjectBtn.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>Upload Project</span>
            `;

        }

    }
);


// ============================================================
// CERTIFICATE UPLOAD
// ============================================================

uploadCertificateBtn.addEventListener(
    "click",
    async () => {

        const file =
            certificateFileInput.files[0];


        // ----------------------------------------------------
        // FILE VALIDATION
        // ----------------------------------------------------

        if (!file) {

            setMessage(
                certificateUploadStatus,
                "Please select a certificate PDF first.",
                "error-message"
            );

            return;

        }


        if (
            !file.name
                .toLowerCase()
                .endsWith(".pdf")
        ) {

            setMessage(
                certificateUploadStatus,
                "Certificate must be a PDF file.",
                "error-message"
            );

            return;

        }


        try {

            // ------------------------------------------------
            // LOADING STATE
            // ------------------------------------------------

            uploadCertificateBtn.disabled =
                true;

            uploadCertificateBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Uploading...</span>
            `;


            setMessage(
                certificateUploadStatus,
                "Uploading certificate securely..."
            );


            // ------------------------------------------------
            // CREATE CERTIFICATE NAME
            // ------------------------------------------------

            const certificateName =
                createDisplayName(
                    file.name,
                    "pdf"
                );


            // ------------------------------------------------
            // UPLOAD TO CLOUDFLARE WORKER
            // ------------------------------------------------

            const uploadResult =
                await uploadFileToWorker(
                    file,
                    "certificate"
                );


            // ------------------------------------------------
            // SAVE METADATA TO FIRESTORE
            // ------------------------------------------------

            setMessage(
                certificateUploadStatus,
                "Saving certificate information..."
            );


            await addDoc(

                collection(
                    db,
                    "certificates"
                ),

                {

                    name:
                        certificateName,

                    originalFileName:
                        file.name,

                    fileURL:
                        uploadResult.fileURL,

                    githubURL:
                        uploadResult.githubURL,

                    storagePath:
                        uploadResult.storagePath,

                    fileSize:
                        uploadResult.fileSize,

                    uploadedBy:
                        auth.currentUser.email,

                    createdAt:
                        serverTimestamp()

                }

            );


            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            setMessage(
                certificateUploadStatus,
                `Certificate "${certificateName}" uploaded successfully.`,
                "success-message"
            );


            console.log(
                "Certificate upload successful:",
                uploadResult
            );


            // ------------------------------------------------
            // RESET INPUT
            // ------------------------------------------------

            certificateFileInput.value =
                "";

            certificateSelectedFile.textContent =
                "No certificate selected.";


        } catch (error) {

            console.error(
                "Certificate Upload Error:",
                error
            );


            setMessage(
                certificateUploadStatus,
                `Certificate upload failed: ${error.message}`,
                "error-message"
            );


        } finally {

            uploadCertificateBtn.disabled =
                false;

            uploadCertificateBtn.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>Upload Certificate</span>
            `;

        }

    }
);