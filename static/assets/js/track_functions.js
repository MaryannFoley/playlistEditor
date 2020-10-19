var remove = {"tracks":[]};
var privacyModified = false;
var nameModified = false;
var descModified = false;

function removeRow(id){
  remove.tracks.push({"uri":id});
  document.getElementById(id).remove();
}

function saveChanges(id, auth){
  console.log(remove, remove.tracks.length);
  if (remove.tracks.length > 0){
    var delUrl = "https://api.spotify.com/v1/playlists/".concat(id,"/tracks");
    console.log(delUrl);
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

    var modUrl = "https://api.spotify.com/v1/playlists/".concat(id);
    mods=JSON.stringify({"name":name,"public":public});
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
}
function nameMod(){
  nameModified=true;
}
function descMod(){
  descModified=true;
}
