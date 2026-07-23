// ===============================
// VIDLYRA MY LIST
// ===============================

let myList = JSON.parse(localStorage.getItem("vidlyraList")) || [];

function addToList(title, image, genre) {

    const exists = myList.find(item => item.title === title);

    if (exists) {
        alert("Already in My List");
        return;
    }

    myList.push({
        title,
        image,
        genre
    });

    localStorage.setItem(
        "vidlyraList",
        JSON.stringify(myList)
    );

    alert(title + " added to My List ❤️");
}

function removeFromList(title){

    myList = myList.filter(item=>item.title!==title);

    localStorage.setItem(
        "vidlyraList",
        JSON.stringify(myList)
    );

    loadMyList();

}

function loadMyList(){

    const container=document.querySelector(".mylist-grid");

    if(!container) return;

    container.innerHTML="";

    if(myList.length===0){

        container.innerHTML=`
        <h2>No Anime Added Yet</h2>
        `;

        return;

    }

    myList.forEach(item=>{

        container.innerHTML+=`

        <div class="saved-card">

            <img src="${item.image}">

            <h3>${item.title}</h3>

            <p>${item.genre}</p>

            <div class="saved-buttons">

                <a href="watch.html">
                    <button>▶ Watch</button>
                </a>

                <button onclick="removeFromList('${item.title}')">

                    Remove

                </button>

            </div>

        </div>

        `;

    });

}

loadMyList();
