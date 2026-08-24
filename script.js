document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // MOBILE NAVIGATION
    // ============================================================

    const hamburger = document.querySelector(".hamburger");
    const nav = document.querySelector("nav");

    if (hamburger && nav) {

        hamburger.addEventListener("click", () => {

            nav.classList.toggle("active");

        });

    }


    // ============================================================
    // TYPING ANIMATION
    // ============================================================

    const typingElement =
        document.getElementById("typing");

    const articleElement =
        document.getElementById("article");


    // ------------------------------------------------------------
    // Only run typing animation on pages that contain it.
    // ------------------------------------------------------------

    if (!typingElement) {

        return;

    }


    const words = [
        "Data Scientist",
        "Python Programmer",
        "AI Developer",
        "Developer",
        "SQL Programmer"
    ];


    let wordIndex = 0;
    let letterIndex = 0;
    let currentWord = "";
    let currentLetters = "";
    let isDeleting = false;


    // ============================================================
    // ARTICLE GENERATOR
    // ============================================================

    function updateArticle(word) {

        const firstLetter =
            word.trim().charAt(0).toLowerCase();

        const vowels = [
            "a",
            "e",
            "i",
            "o",
            "u"
        ];

        return vowels.includes(firstLetter)
            ? "an"
            : "a";

    }


    // ============================================================
    // UPDATE ARTICLE SAFELY
    // ============================================================

    function updateArticleElement(word) {

        // The article element only exists on the home page.
        // Other pages don't need it.

        if (!articleElement) {

            return;

        }

        articleElement.innerText =
            updateArticle(word);

    }


    // ============================================================
    // TYPING FUNCTION
    // ============================================================

    function type() {

        if (isDeleting) {

            currentLetters =
                currentWord.substring(
                    0,
                    letterIndex - 1
                );

            letterIndex--;

        } else {

            currentLetters =
                currentWord.substring(
                    0,
                    letterIndex + 1
                );

            letterIndex++;

        }


        typingElement.innerHTML =
            currentLetters;


        let typeSpeed = 200;


        if (isDeleting) {

            typeSpeed /= 2;

        }


        // --------------------------------------------------------
        // Word completely typed
        // --------------------------------------------------------

        if (
            !isDeleting &&
            letterIndex === currentWord.length
        ) {

            typeSpeed = 2000;

            isDeleting = true;

        }


        // --------------------------------------------------------
        // Word completely deleted
        // --------------------------------------------------------

        else if (
            isDeleting &&
            letterIndex === 0
        ) {

            isDeleting = false;

            wordIndex++;


            if (
                wordIndex === words.length
            ) {

                wordIndex = 0;

            }


            currentWord =
                words[wordIndex];


            updateArticleElement(
                currentWord
            );


            typeSpeed = 500;

        }


        setTimeout(
            type,
            typeSpeed
        );

    }


    // ============================================================
    // START TYPING ANIMATION
    // ============================================================

    currentWord =
        words[wordIndex];


    updateArticleElement(
        currentWord
    );


    type();

});