document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');

    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

    const typingElement = document.getElementById('typing');
    const articleElement = document.getElementById('article'); // NEW
    const words = ["Wordpress Developer", "Prompt Engineer", "Video Editor", "Facebook Ads Advertiser"];
    let wordIndex = 0;
    let letterIndex = 0;
    let currentWord = '';
    let currentLetters = '';
    let isDeleting = false;

    function updateArticle(word) {
        const firstLetter = word.trim().charAt(0).toLowerCase();
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        return vowels.includes(firstLetter) ? 'an' : 'a';
    }

    function type() {
        if (isDeleting) {
            currentLetters = currentWord.substring(0, letterIndex - 1);
            letterIndex--;
        } else {
            currentLetters = currentWord.substring(0, letterIndex + 1);
            letterIndex++;
        }

        typingElement.innerHTML = currentLetters;

        let typeSpeed = 200;
        if (isDeleting) {
            typeSpeed /= 2;
        }

        if (!isDeleting && letterIndex === currentWord.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && letterIndex === 0) {
            isDeleting = false;
            wordIndex++;
            if (wordIndex === words.length) {
                wordIndex = 0;
            }
            currentWord = words[wordIndex];
            articleElement.innerText = updateArticle(currentWord); // UPDATE HERE
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    currentWord = words[wordIndex];
    articleElement.innerText = updateArticle(currentWord); // INITIAL SET
    type();
});