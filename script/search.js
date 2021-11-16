
  var fixHelperModified = function(e, tr) {
		var $originals = tr.children();
		var $helper = tr.clone();
		$helper.children().each(function(index) {
			$(this).width($originals.eq(index).width())
		});
		return $helper;
	}

  var mydata = [];

  $("#myTable tbody").sortable({
    helper: fixHelperModified,
    start: function( event, ui ) {
      $('td.index', ui.item.parent()).each(function (i) {
        mydata.push({type : "PreviousChange", id :   $(this).children('.id').html() , title :   $(this).children('#title').children('input').val() ,description :  $(this).children('#description').children('input').val()});
      });
    },
    stop: updateIndex
	}).disableSelection();
	
		$("tbody").sortable({
		distance: 5,
		delay: 100,
		opacity: 0.6,
		cursor: 'move',
		update: function() {
    }
	});

  function updateIndex(event,ui){
    $('td.index', ui.item.parent()).each(function (i) {
      $(this).html(i+1);
      mydata.push({type : "Actual", id :  $(this).children('.id') , title :   $(this).children('#title').children('input').val() ,description :  $(this).children('#description').children('input').val()});
    });

    mydata = JSON.stringify(mydata);

    $.ajax({
      url: "/ChangeSearch",
      type: "POST",
      /*dataType: "json",*/
      data: mydata,
      contentType: "application/json",
      cache: false,

      timeout: 5000,

      complete: function() {
      },

      success: function() {
      }
    });
  }

  function GetCaptionsListById(caption_id){
    var mydata = JSON.stringify({id : caption_id});

    $.ajax({
        url: "/captions_by_Id",
        type: "POST",
        /*dataType: "json",*/
        data: mydata,
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success: function(ret) {
          if(ret == "No Caption")
          {
            let answer = window.confirm("Il n'y a pas de sous-titre, voulez-vous en ajouter ?");
            if (answer) window.location.replace('/LesSousTitre');
          }
          else 
          {
            window.location.replace('/LesSousTitre');
          }
        },

        error: function(e) {
           alert("Impossible d'obtenir les sous-titres.");
           console.log(e);
        }
        });
    }

    function Next(){
      window.location.replace('/NextSearch');
    }

    function Previous(){
      window.location.replace('/PreviousSearch');
    }

    function updateall(){
      let mydata = [];

      $('td.index').each(function (i) {
        mydata.push({id :  $('td.index').parent().children('.id').html() , title :  $('td.index').parent().children('#title').children('input').val() ,description : $('td.index').parent().children('#description').children('input').val()});
      });

      console.log(mydata);

      mydata = JSON.stringify(mydata);

      $.ajax({
        url: "/updateAllSearch",
        type: "POST",
        /*dataType: "json",*/
        data: mydata,
        contentType: "application/json",
        cache: false,
        timeout: 5000,

        success: function() {
          alert("L'enregistrement est un succès");
        },
  
        error: function(e) {
          alert("L'enregistrement est en erreur");
          console.log(e);
        }
        });
    }

    $("#LogOut").click(function(){
      document.cookie = "jwt= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
      window.location.href = "/",true;
  });


