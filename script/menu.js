$(document).ready(function(){

    $("#Init_Form").submit(function(e) {
        e.preventDefault(); 

        var checkbox =  $(this).find("input.Lang[type=checkbox]:checked");
        var MyLanguageFilter = "";

        var CaptionFil = $(this).find("#checkbox_Captions:checked").val();
        var ChapiterFil = $(this).find("#checkbox_Chapitre:checked").val();

        $.each(checkbox, function(key, val) {
            if(key == (checkbox.length-1))
            {
                MyLanguageFilter +=  $(val).val();
            }
            else
            {
                MyLanguageFilter +=  $(val).val() + ",";
            }
        });

        mydata = JSON.stringify( {
                Search_query: $(this).find("#InputOfSearch").val(),
                LanguageFilter: MyLanguageFilter,
                CaptionsFilter : CaptionFil,
                ChapitreFilter : ChapiterFil,
            });

        $.ajax({
            url: "/search_by_keywords",
            type: "POST",
            data: mydata,
            contentType: "application/json",
            cache: false,
            timeout: 5000,
            
            complete: function() {
               
            },

            success: function() {
                window.location.replace('/search_by_keywords');
            },

            error: function(e) {
                $('#status').innerHTML = e;
            },
            });

    });


    $("#LogOut").click(function(){
        document.cookie = "jwt= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
        window.location.href = "/",true;
    });

});