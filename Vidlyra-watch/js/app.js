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
/* ===========================
Dynamic Hero Banner
===========================*/

const hero = document.getElementById("hero");

const heroTitle = document.getElementById("heroTitle");

const heroDescription = document.getElementById("heroDescription");

const featured = [

{
title:"UNEXPECTED",

description:"A mysterious event changes the destiny of an entire world.",

image:"assets/images/Unexpected.png"
},

{
title:"HOLLOW FREQUENCY",

description:"The signal has returned. Humanity must decide whether to answer.",

image:"assets/images/hollow frequency code zero.png"
},

{
title:"CRIMSON VELOCITY",

description:"Speed alone cannot save the future.",

image:"assets/images/Crimson velocity.png"
}

];

let current = 0;

function changeHero(){

hero.style.backgroundImage =
`url(${featured[current].image})`;

heroTitle.textContent =
featured[current].title;

heroDescription.textContent =
featured[current].description;

current++;

if(current >= featured.length){

current = 0;

}

}

changeHero();

setInterval(changeHero,6000);
/*============================
Continue Watching Slider
=============================*/

const continueCarousel =
document.getElementById("continueCarousel");

document.querySelector(".continue-next")
.addEventListener("click",()=>{

continueCarousel.scrollBy({

left:380,

behavior:"smooth"

});

});

document.querySelector(".continue-prev")
.addEventListener("click",()=>{

continueCarousel.scrollBy({

left:-380,

behavior:"smooth"

});

});
/*=============================
Original Slider
==============================*/

const originalCarousel =
document.getElementById("originalCarousel");

document.querySelector(".original-next")
.addEventListener("click",()=>{

originalCarousel.scrollBy({

left:360,

behavior:"smooth"

});

});

document.querySelector(".original-prev")
.addEventListener("click",()=>{

originalCarousel.scrollBy({

left:-360,

behavior:"smooth"

});

});
/*==========================
Episode Slider
===========================*/

const episodeCarousel =
document.getElementById("episodeCarousel");

document.querySelector(".episode-next")
.addEventListener("click",()=>{

episodeCarousel.scrollBy({

left:450,

behavior:"smooth"

});

});

document.querySelector(".episode-prev")
.addEventListener("click",()=>{

episodeCarousel.scrollBy({

left:-450,

behavior:"smooth"

});

});
