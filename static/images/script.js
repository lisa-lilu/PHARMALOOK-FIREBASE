document.addEventListener("DOMContentLoaded", () => {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach((item) => {
        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        const icon = item.querySelector(".faq-icon");

        question.addEventListener("click", () => {
            const isOpen = answer.classList.contains("open");


            document.querySelectorAll(".faq-answer").forEach((ans) => ans.classList.remove("open"));
            document.querySelectorAll(".faq-icon").forEach((ic) => ic.textContent = "˅");


            if (!isOpen) {
                answer.classList.add("open");
                icon.textContent = "˄";
            } else {
                answer.classList.remove("open");
                icon.textContent = "˅";
            }
        });
    });
});

