const { isRegExp } = require("util/types");

  $(".fileupload").change(function(){ //Update Captions
      let file = evt.target.files[0]; 

      var type;

      if(file.type == "")
        type = file.name.split('.').pop();
      else
        type = file.type;

      if(type == "tfmt" || type == "sbv" || type== "scc"  || type == "srt" || type == "ttml" || type == "vtt")
      {
        file.arrayBuffer().then((arrayBuffer) => {

          try
          {
            let blob = new Blob([new Uint8Array(arrayBuffer)], {type: file.type });
            let caption_id = this.parent().parent().children(".id").html();
            let name = this.parent().parent().children("td.name").val();
            let language = this.parent().parent().children("td.language").val();
            let trackKind = this.parent().parent().children("td.trackKind").val();
            let audioTrackType = this.parent().parent().children("td.audioTrackType").val();
            let isCC = this.parent().parent().children("td.isCC").val();
            let isEasyReader = this.parent().parent().children("td.isEasyReader").val();
            let isAutoSynced = this.parent().parent().children("td.isAutoSynced").val();
            let isDraft = this.parent().parent().children("td.isDraft").val();

            console.log(caption_id);

            let snippet = {
              name : name,
              language : language,
              trackKind , trackKind,
              audioTrackType : audioTrackType,
              isCC : isCC,
              isEasyReader : isEasyReader,
              isAutoSynced : isAutoSynced,
              isDraft : isDraft
            }

            var mydata = JSON.stringify({id : caption_id ,file :  blob,snippet : snippet});
        
            $.ajax({
                url: "/update_captions_by_Id",
                type: "POST",
                data: mydata,
              /* dataType: "json",*/
                contentType: "application/json",
                cache: false,
                timeout: 5000,
              
                success: function() {
                  alert("le fichier a été bien envoyé");
                },
        
                error: function(e) {
                    $('#status').innerHTML = e;
                },
            });
          }
          catch(e)
          {
            console.log(e);
            alert("Erreur d'upload , contactez un administrateur");
          }
        });
      }
      else
      {
        alert("Seul les types tfm,sbv,scc,srt,ttml,vtt sont autorisé");
      }
     
     
    
  });


  $(".fileupload_insert").change(function(evt){ //Insert Caption

    let file = evt.target.files[0]; 

    var type;

    if(file.type == "")
      type = file.name.split('.').pop();
    else
      type = file.type;
    

    if(type == "tfmt" || type == "sbv" || type== "scc"  || type == "srt" || type == "ttml" || type == "vtt")
    {
      file.arrayBuffer().then((arrayBuffer) => {

        try
        {
          let blob = new Blob([new Uint8Array(arrayBuffer)], {type: type });
          let videoid = document.querySelector(".fileupload_insert").id;

          console.log(videoid);

          let data = {
            id : {
              videoid : videoid
            },
            snippet : {
            name : document.getElementById('name').value,
            language : document.getElementById('language').value, 
            trackKind : document.getElementById('trackKind').value, 
            audioTrackType : document.getElementById('audioTrackType').value, 
            isCC : document.getElementById('isCC').value, 
            isEasyReader : document.getElementById('isEasyReader').value, 
            isAutoSynced :  document.getElementById('isAutoSynced').value, 
            isDraft :  document.getElementById('isDraft').value},
            file :  blob};
           
           data = JSON.stringify(data);
      
          $.ajax({
              url: "/insert_captions_by_Id",
              type: "POST",
              data: data,
            /* dataType: "json",*/
              contentType: "application/json",
              cache: false,
              timeout: 5000,
            
              success: function() {
                alert("le fichier a été bien envoyé");

                window.location.replace("/LesSousTitre");

              },
      
              error: function(e) {
                  $('#status').innerHTML = e;
              },
          });
        }
        catch(e)
        {
          console.log(e);
          alert("Erreur d'upload , contactez un administrateur ou utiliser le format tfmt");
        }
      });
    }
    else
    {
      alert("Seul les types tfm,sbv,scc,srt,ttml,vtt sont autorisé");
    }
   
   
  
  });


  function DownloadCaption(caption_id){

    let answer = window.confirm("Voulez-vous sauvegarder le fichier ?");
    if (answer)
    {
    var mydata = JSON.stringify({id : caption_id});

    $.ajax({
        url: "/download_captions_by_Id",
        type: "POST",
        data: mydata,
          /*dataType: "json",*/
        contentType: "application/json",
        cache: false,
        timeout: 5000,
      
        success: function(ret) {
          DownloadBrowser(ret,"Captions."+ret.body.tfmt,"application/octet-stream");
        },

        error: function(e) {
            $('#status').innerHTML = e;
        },
        });
    }
  }

  function DeleteCaption(caption_id){
    let answer = window.confirm("Voulez-vous supprimer ce sous-titrage ?");
    if (answer)
    {
    var mydata = JSON.stringify({id : caption_id});

    $.ajax({
        url: "/delete_captions_by_Id",
        type: "POST",
        data: mydata,
          /*dataType: "json",*/
        contentType: "application/json",
        cache: false,
        timeout: 5000,
      
        success: function() {
          window.location.replace('/LesSousTitre');
        },

        error: function(e) {
           alert("Impossible de supprimer ce sous-titrage");
           console.log(e);
        },
        });
    }
  }
  
  function DownloadBrowser(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 1); 
    }
  }

  $("#LogOut").click(function(){
    document.cookie = "jwt= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
    window.location.href = "/",true;
  });