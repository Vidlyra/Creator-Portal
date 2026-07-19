async function uploadProject(){

const title=document.getElementById("title").value;

const description=document.getElementById("description").value;

const category=document.getElementById("category").value;

const file=document.getElementById("thumbnail").files[0];

if(!file){

alert("Choose Thumbnail");

return;

}

const filename=Date.now()+"-"+file.name;

const {data,error}=await supabase.storage

.from("thumbnails")

.upload(filename,file);

if(error){

alert(error.message);

return;

}

const imageUrl=supabase.storage

.from("thumbnails")

.getPublicUrl(filename)

.data.publicUrl;

const user=(await supabase.auth.getUser()).data.user;

await supabase

.from("projects")

.insert({

user_id:user.id,

title,

description,

category,

thumbnail:imageUrl,

status:"Pending"

});

alert("Uploaded Successfully");

location.href="dashboard.html";

}
