var remove = {"tracks":[]};
var privacyModified = false;
var nameModified = false;
var descModified = false;


function removeRow(id){
  remove.tracks.push({"uri":id});
  document.getElementById(id).remove();
  document.getElementById("saveButton").disabled=false;
  document.getElementById("discardButton").disabled=false;
}

function saveChanges(id, auth){
  //console.log(remove, remove.tracks.length);
  if (remove.tracks.length > 0){
    var delUrl = "https://api.spotify.com/v1/playlists/".concat(id,"/tracks");
    //console.log(delUrl);
    remove=JSON.stringify(remove);
    $.ajax({
      url: delUrl,
      type:"delete",
      headers:{'Content-Type':'application/json','Authorization':auth},
      data:remove,
      success: function() { console.log('Success!');},
      error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr.status);
        console.log(thrownError);
      }
    })

    remove={"tracks":[]};
  }
  if (privacyModified || nameModified || descModified){
    var public = !document.getElementById("myonoffswitch").checked;
    var name = document.getElementById("nameField").value;
    var desc=document.getElementById("description").value;

    var modUrl = "https://api.spotify.com/v1/playlists/".concat(id);
    mods=JSON.stringify({"name":name,"public":public,"description":desc});
    //console.log(mods);
    $.ajax({
      url: modUrl,
      type:"put",
      headers:{'Content-Type':'application/json','Authorization':auth},
      data:mods,
      success: function() { console.log('Success!');},
      error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr.status);
        console.log(thrownError);
      }
    })
    privacyModified=false;
    nameModified=false;
    descModified=false;
  }
}

function publicMod(){
  privacyModified=true;
  document.getElementById("saveButton").disabled=false;
  document.getElementById("discardButton").disabled=false;
}
function nameMod(){
  nameModified=true;
  document.getElementById("saveButton").disabled=false;
  document.getElementById("discardButton").disabled=false;
}
function descMod(){
  descModified=true;
  document.getElementById("saveButton").disabled=false;
  document.getElementById("discardButton").disabled=false;
}


function search(auth,currID,currType){
  var search=document.getElementById("searchbar").value.replace(/['"]+/g, '');
  //console.log(auth);
  if (search!=""){
    var searchURL = "https://api.spotify.com/v1/search?q=".concat(JSON.stringify(search),"&type=album,playlist&limit=10");
    var compURL = "/compare?type1=".concat(currType,"&id1=",currID)
    $.ajax({
      url: searchURL,
      type:"get",
      headers:{'Content-Type':'application/json','Authorization':auth},
      dataType:'json',
      success: function(response) {
        console.log('Success!');
        //console.log(response);

        if (response.albums.total == 0 && response.playlists.total == 0){
          document.getElementById("accordion").innerHTML="<h6>No results found.</h6>"
        }
        else if (response.albums.total == 0 || response.playlists.total == 0){
          document.getElementById("accordion").innerHTML='<ul class="list-group overflow-auto" id="modalcontent"><li class="list-group-item"><span>List Group Item 2</span></li></ul>';
          var list=document.getElementById("modalcontent");
          list.empty();
          var val;
          for (val in response.albums.items){
            val=response.albums.items[val];
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.appendChild(document.createTextNode(val.name));
            artist=document.createElement("small").innerHTML=" by ".concat(val.artists[0].name);
            a.append(artist);
            li.setAttribute("id", "element4");
            li.setAttribute("class","list-group-item");
            a.setAttribute("href",compURL.concat("&type2=albums&id2=",val.id));
            li.appendChild(a);
            list.append(li);
          }
          for (val in response.playlists.items){
            val=response.playlists.items[val];
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.appendChild(document.createTextNode(val.name));
            artist=document.createElement("small").innerHTML=" by ".concat(val.owner.display_name);
            a.append(artist);
            li.setAttribute("id", "element4");
            li.setAttribute("class","list-group-item");
            a.setAttribute("href",compURL.concat("&type2=playlists&id2=",val.id));
            li.appendChild(a);
            list.append(li);
          }

        }
        else{
          var strCard=`                            <div class="card">
              <div class="card-header" id="headingOne">
                <h5 class="mb-0">
                  <button class="btn btn-link" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                    Playlists
                  </button>
                </h5>
              </div>

              <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                <div class="card-body">
                  <ul class="list-group overflow-auto" id="modalplaylist">
                    </ul>
                  </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header" id="headingTwo">
                <h5 class="mb-0">
                  <button class="btn btn-link collapsed" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                    Albums
                  </button>
                </h5>
              </div>
              <div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-parent="#accordion">
                <div class="card-body">
                  <ul class="list-group overflow-auto" id="modalalbums">
                  </ul>
                  </div>
              </div>
            </div>
          </div>`;
          document.getElementById("accordion").innerHTML=strCard;
          var alist=document.getElementById("modalalbums");
          var plist=document.getElementById("modalplaylist");

          var val;
          for (val in response.albums.items){
            val=response.albums.items[val];
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.appendChild(document.createTextNode(val.name));
            artist=document.createElement("small").innerHTML=" by ".concat(val.artists[0].name);
            a.append(artist);
            li.setAttribute("id", "element4");
            li.setAttribute("class","list-group-item");
            a.setAttribute("href",compURL.concat("&type2=albums&id2=",val.id));
            li.appendChild(a);
            alist.append(li);
          }
          for (val in response.playlists.items){
            val=response.playlists.items[val];
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.appendChild(document.createTextNode(val.name));
            artist=document.createElement("small").innerHTML=" by ".concat(val.owner.display_name);
            a.append(artist);
            li.setAttribute("id", "element4");
            li.setAttribute("class","list-group-item");
            a.setAttribute("href",compURL.concat("&type2=playlists&id2=",val.id));
            li.appendChild(a);
            plist.append(li);
          }
        }
      },
      error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr.status);
        console.log(thrownError);
      }
    })
  }
}
