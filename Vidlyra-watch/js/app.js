/* ==========================================
   VIDLYRA WATCH - APP.JS
========================================== */

/* ==========================
   TRENDING SLIDER
========================== */

const carousel = document.getElementById("trendingCarousel");

if (carousel) {

    document.querySelector(".next-btn").addEventListener("click", () => {
        carousel.scrollBy({
            left: 320,
            behavior: "smooth"
        });
    });

    document.querySelector(".prev-btn").addEventListener("click", () => {
        carousel.scrollBy({
            left: -320,
            behavior: "smooth"
        });
    });

}

/* ==========================
   HERO SLIDER
========================== */

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

let currentHero = 0;

// preload images
featured.forEach(item=>{
    const img = new Image();
    img.src = item.image;
});

function updateHero(){

    hero.style.opacity="0";

    setTimeout(()=>{

        hero.style.backgroundImage=`url("${featured[currentHero].image}")`;
        hero.style.backgroundSize="cover";
        hero.style.backgroundPosition="center";
        hero.style.backgroundRepeat="no-repeat";

        heroTitle.textContent=featured[currentHero].title;
        heroDescription.textContent=featured[currentHero].description;

        hero.style.opacity="1";

        currentHero++;

        if(currentHero>=featured.length){
            currentHero=0;
        }

    },300);

}

if(hero){

    hero.style.transition="opacity .5s ease";

    updateHero();

    setInterval(updateHero,6000);

}

/* ==========================
   CONTINUE WATCHING
========================== */

const continueCarousel=document.getElementById("continueCarousel");

if(continueCarousel){

document.querySelector(".continue-next").addEventListener("click",()=>{

continueCarousel.scrollBy({

left:380,
behavior:"smooth"

});

});

document.querySelector(".continue-prev").addEventListener("click",()=>{

continueCarousel.scrollBy({

left:-380,
behavior:"smooth"

});

});

}

/* ==========================
   ORIGINALS
========================== */

const originalCarousel=document.getElementById("originalCarousel");

if(originalCarousel){

document.querySelector(".original-next").addEventListener("click",()=>{

originalCarousel.scrollBy({

left:360,
behavior:"smooth"

});

});

document.querySelector(".original-prev").addEventListener("click",()=>{

originalCarousel.scrollBy({

left:-360,
behavior:"smooth"

});

});

}

/* ==========================
   EPISODES
========================== */

const episodeCarousel=document.getElementById("episodeCarousel");

if(episodeCarousel){

document.querySelector(".episode-next").addEventListener("click",()=>{

episodeCarousel.scrollBy({

left:450,
behavior:"smooth"

});

});

document.querySelector(".episode-prev").addEventListener("click",()=>{

episodeCarousel.scrollBy({

left:-450,
behavior:"smooth"

});

});

}
