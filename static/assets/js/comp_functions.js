var remove = [{"tracks":[]},{"tracks":[]}];
var add = [{"uris":[]},{"uris":[]}];
var modified = [false,false];
var details = [false,false];

function removeRow(id,side){
  remove[side].tracks.push({"uri":id});
  if (side==0){
    document.getElementById("left".concat(id)).remove();}
  else {
    document.getElementById("right".concat(id)).remove();
  }
  mod(side);
  //console.log(remove);
}

function addRow(id,side,content){
  add[Math.abs(side-1)].uris.push(id);
  if (side==0){
    var newItem=document.createElement("li");
    newItem.innerHTML=content;
    newItem.setAttribute("class","list-group-item" );
    var list = document.getElementById("rightList");
    list.insertBefore(newItem, list.childNodes[0]);
  }
  else {
    var newItem=document.createElement("li");
    newItem.setAttribute("class","list-group-item" );
    newItem.innerHTML=content;
    var list = document.getElementById("leftList");
    list.insertBefore(newItem, list.childNodes[0]);
  }
  mod(Math.abs(side-1));
}

function saveChanges(id, num, auth){
  if (remove[num].tracks.length > 0){
    var delUrl = "https://api.spotify.com/v1/playlists/".concat(id,"/tracks");
    //console.log(delUrl);
    remove1=JSON.stringify(remove[num]);
    $.ajax({
      url: delUrl,
      type:"delete",
      headers:{'Content-Type':'application/json','Authorization':auth},
      data:remove1,
      success: function() { console.log('Success!');},
      error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr.status);
        console.log(thrownError);
      }
    })

    remove[num]={"tracks":[]};
  }
  if (add[num].uris.length > 0){
    //console.log(add);
    var addUrl = "https://api.spotify.com/v1/playlists/".concat(id,"/tracks");
    //console.log(addUrl);
    add1=JSON.stringify(add[num]);
    $.ajax({
      url: addUrl,
      type:"post",
      headers:{'Content-Type':'application/json','Authorization':auth},
      data:add1,
      success: function() { console.log('Success!');},
      error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr.status);
        console.log(thrownError);
      }
    })

    remove[num]={"tracks":[]};
  }
  if (details[num]){
    var public = !document.getElementById("myonoffswitch".concat(1+num)).checked;
    var name = document.getElementById("nameField".concat(1+num)).value;
    var desc=document.getElementById("description".concat(1+num)).value;

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
    modified[num]=false;
  }
  document.getElementById("saveButton".concat(num+1)).disabled=true;
}

function mod(num){
  modified[num]=true;
  document.getElementById("saveButton".concat(num+1)).disabled=false;
}

function modDet(num){
  details[num]=true;
  mod(num);
}
