const carousel = document.getElementById("trendingCarousel");

const nextBtn = document.querySelector(".next-btn");

const prevBtn = document.querySelector(".prev-btn");

const scrollAmount = 320;

nextBtn.addEventListener("click",()=>{

carousel.scrollBy({

left:scrollAmount,

behavior:"smooth"

});

});

prevBtn.addEventListener("click",()=>{

carousel.scrollBy({

left:-scrollAmount,

behavior:"smooth"

});

});
