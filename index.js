const express = require("express");
const google = require("googleapis").google;
const jwt = require("jsonwebtoken");
var bodyParser = require('body-parser');
const fs = require('fs');

// Google's OAuth2 client
const OAuth2 = google.auth.OAuth2

// Including our config file
const CONFIG = require("./config");

// Create an OAuth2 client object from the credentials in our config file
const oauth2Client = new OAuth2(
  CONFIG.oauth2Credentials.client_id,
  CONFIG.oauth2Credentials.client_secret,
  CONFIG.oauth2Credentials.redirect_uris[0]
);

// Creating our express application
const app = express();

// Get the youtube service
const service = google.youtube("v3");

// Allowing ourselves to use cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser());


// Setting up Views
app.set("view engine", "ejs");
app.set('views', __dirname + '/views');
app.use('/script', express.static(__dirname + '/script'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view options", {layout: true});

//Model & Variable to save
const Search = require('./model/search');
const Captions = require('./model/captions');

var PreviousHistoricalSearch = [];
var NextHistoricalSearch = [];
var ActualDisplaySearch = [];
var Search_Ouput =  [];
var CaptionsList = [];

app.get("/", function(req, res) {
  // Obtain the google login link to which we'll send our users to give us access
  const loginLink = oauth2Client.generateAuthUrl({
    access_type: "online", // Indicates that we can't access data if disconnected
    scope: CONFIG.oauth2Credentials.scopes // Using the access scopes from our config file
  });
  return res.render("index", { loginLink: loginLink }); 
});

app.get("/oauth2callback", function(req, res) {  // Store the credentials given by google into a jsonwebtoken in a cookie called 'jwt'
  if (req.query.error) {
    // The user did not give us permission.
    return res.redirect("/");
  } else {
    oauth2Client.getToken(req.query.code, function(err, token) {
      if (err) return res.redirect("/"); //Permission denied
      res.cookie("jwt", jwt.sign(token, CONFIG.JWTsecret,{expiresIn : 2000}));
      return res.redirect("/menu_principal"); 
    });
  }
});

app.get("/menu_principal",function(req,res){
    verify_identity(req,res); 
    return res.render("menu");
});

                                                                    /* Search */

app.get("/search_by_keywords", function(req, res) { 
  verify_identity(req,res); 

  if(Search_Ouput.length == 0)
  return res.redirect("/menu_principal"); 
  
  return  res.render("search", { searchs : Search_Ouput });
});

app.post("/search_by_keywords", function(req, res) { 
  verify_identity(req,res);

  var CaptionsFilter;

  if(req.body.CaptionsFilter == "True") CaptionsFilter = "closedCaption";
  else CaptionsFilter = "any";

  if(fs.existsSync('./Saved_file/search'+req.body.Search_query+'.json')) {           
      fs.readFile('./Saved_file/search'+req.body.Search_query+'.json', (err, data) => {
        Search_Ouput = JSON.parse(data);
        return  res.sendStatus(200);
      });
  }
  else
  {
    try
    {
      service.search
      .list({
        auth: oauth2Client,
        mine: true,
        part: "id,snippet",
        q : req.body.Search_query,
        maxResults: 20,
        relevanceLanguage : req.body.LanguageFilter,
        videoCaption : CaptionsFilter,
      })
      .then(response => {

        for(let i = 0 ; i < response.data.items.length;i++)
        {
          Search_Ouput.push(new Search(response.data.items[i].id,response.data.items[i].snippet,decodeEntities(response.data.items[i].snippet.title)));
        }
     
        }).then(() => {
          for(let i = 0 ; i < Search_Ouput.length;i++)
          {
            service.videos
            .list({
              auth: oauth2Client,
              part: "id,snippet",
              id : Search_Ouput[i].id.videoId
            })
            .then(response => {
              Search_Ouput[i].snippet.categoryId = response.data.items[0].snippet.categoryId;
            });
          }
          return res.sendStatus(200);
        }).then(() => {
          fs.writeFile('./Saved_file/search'+req.body.Search_query+'.json', JSON.stringify(Search_Ouput), (err) => {
            if (err) console.log(err);
            console.log("Successfully Written to File.");
          });
        }); 
    }
    catch(e)
    {
      return res.status(403).send(e);
    }
  }
});

app.post("/updateAllSearch", function(req, res) { 

  verify_identity(req,res);

  for(let i = 0; i < req.body.length;i++)
  {
    for(let u = 0 ; u < Search_Ouput.length;u++)
    {
      if(req.body[i].id == Search_Ouput[u].id.videoId)
      {    
    
        console.log(Search_Ouput[u]);

        let snippet = {
          title : req.body[i].title,
          description : req.body[i].description,
          categoryId :  Search_Ouput[u].snippet.categoryId
        };

        try
        {
          service.videos
          .update({
            auth: oauth2Client,
            part: "id,snippet",
            id :  Search_Ouput[u].id.videoId,
            snippet : snippet,
            onBehalfOfContentOwner : oauth2Client.credentials
          });
        }
        catch(e)
        {
          return res.status(403).send(e);
        }
      }
    }
  }

  return res.status(200);

});

app.post("/ChangeSearch", function(req, res) { //Change On the Search Table
  verify_identity(req,res); 

  ActualDisplaySearch = [];
  let PreviousAction_Search= [];

  for(let i = 0; i < req.body.lenght;i++ )
  {
    if(req.body[i].type == "PreviousChange")
    {
      PreviousAction_Search.push({id : req.body[i].id , snippet : req.body[i].snippet , index : req.body[i].index});
    }
    if(req.body[i].type == "Actual")
    {
      ActualDisplaySearch.push({id : req.body[i].id , snippet : req.body[i].snippet , index : req.body[i].index});
    }
  }

  PreviousHistoricalSearch.push(PreviousAction_Search);

  res.sendStatus(200);
});

app.get("/PreviousSearch", function(req, res) {
  verify_identity(req,res);

  NextHistoricalSearch.push(ActualDisplaySearch);

  ActualDisplaySearch = PreviousHistoricalSearch[PreviousHistoricalSearch.length];
  PreviousHistoricalSearch.pop();

  Search_Ouput = ActualDisplaySearch;
  
  return res.redirect('/search_by_keywords');
});

app.get("/NextSearch", function(req, res) {
  verify_identity(req,res); 

  PreviousHistoricalSearch.push(ActualDisplaySearch);

  ActualDisplaySearch = NextHistoricalSearch[NextHistoricalSearch.length];

  NextHistoricalSearch.pop();

  Search_Ouput = ActualDisplaySearch;
  
  return res.redirect('/search_by_keywords');
});

                                                                        /* Subtitle / Captions */

app.get("/LesSousTitre",function(req,res){
  if(CaptionsList.length == 0) return res.redirect('/menu_principal');
  
  return res.render('captions',{captions : CaptionsList});
});

app.post("/captions_by_Id",function(req,res){
  verify_identity(req,res);

  if(fs.existsSync('./Saved_file/captionList'+req.body.id+'.json')) 
  {           
    fs.readFile('./Saved_file/captionList'+req.body.id+'.json', (err, data) => {
      CaptionsList = JSON.parse(data);

      return  res.sendStatus(200);
    });
  }
  else
  {
    try
    {
      service.captions
      .list({
        auth: oauth2Client,
        part: "id,snippet",
        videoId : req.body.id,
      })
      .then(response => {

        CaptionsList = [];

        for(let i = 0 ; i < response.data.items.length;i++)
        {
          CaptionsList.push(new Captions(response.data.items[i].id, response.data.items[i].snippet));
        }

        fs.writeFile('./Saved_file/captionList'+req.body.id+'.json', JSON.stringify(CaptionsList), (err) => {
          if (err) console.log(err);
          console.log("Successfully Written to File.");
        });

        return  res.sendStatus(200);
      });
    }
    catch(e){
      return res.status(403).send(e);
    }
  }
});


app.post("/insert_captions_by_Id",function(req,res){

  verify_identity(req,res);

  service.captions
  .insert({
    auth: oauth2Client,
    part : "id,snippet",
    id : req.body.videoid,
    snippet : req.body.snippet,
    fileStream : req.body.file,
    onBehalfOfContentOwner : oauth2Client.credentials
  }).then(response => {

    CaptionsList = [];

    for(let i = 0 ; i < response.data.items.length;i++)
    {
      CaptionsList.push(new Captions(response.data.items[i].id, response.data.items[i].snippet));
    }

    return  res.sendStatus(200);
  });
});

app.post("/update_captions_by_Id",function(req,res){

  verify_identity(req,res);

  for(let i = 0; i < CaptionsList.length;i++)
  {
    if(CaptionsList[i].id == req.body.id)
    {
      CaptionsList[i].snippet.name = req.body.snippet.name;
      CaptionsList[i].snippet.language = req.body.snippet.language;
      CaptionsList[i].snippet.trackKind = req.body.snippet.trackKind;
      CaptionsList[i].snippet.audioTrackType = req.body.snippet.audioTrackType;
      CaptionsList[i].snippet.isCC = req.body.snippet.isCC;
      CaptionsList[i].snippet.isEasyReader = req.body.snippet.isEasyReader;
      CaptionsList[i].snippet.isAutoSynced = req.body.snippet.isAutoSynced; 
      CaptionsList[i].snippet.isDraft = req.body.snippet.isDraft;
      CaptionsList[i].snippet.lastUpdated = Date.now();

      try
      {
        service.captions
        .update({
          auth: oauth2Client,
          part : "id,snippet",
          id : req.body.id,
          snippet : CaptionsList[i].snippet,
          media_body : req.body.file
        }).then(response => {

          CaptionsList = [];

          for(let i = 0 ; i < response.data.items.length;i++)
          {
            CaptionsList.push(new Captions(response.data.items[i].id, response.data.items[i].snippet));
          }
    
          return  res.sendStatus(200);
        });
      }
      catch(e)
      {
        return res.status(403).send(e);
      }
    }
  }
  
});

app.post("delete_captions_by_Id",function(req,res){
  verify_identity(req,res);
  CaptionsList = [];
 
  service.captions
  .delete({
    auth: oauth2Client,
    id : req.body.id
  })
  .then(response => {  
    for(let i = 0 ; i < response.data.items.length;i++)
    {
      CaptionsList.push(new Captions(response.data.items[i].id, response.data.items[i].snippet));
    }

    return  res.sendStatus(200); 
  });
});

app.post("/download_captions_by_Id",function(req,res){

  verify_identity(req,res);

  try
  {
      service.captions
      .download({
        auth: oauth2Client,
        part: "tfmt",
        id : req.body.id,
        onBehalfOfContentOwner : oauth2Client.credentials
      })
      .then(response => {
        return response;
      });
  }
  catch(e)
  {
    return res.status(403).send(e);
  }

});

                                                        /* Utils */

function verify_identity(req,res)
{
  if (!req.cookies.jwt) { //If jwt does not exist
    // We haven't logged in
    return res.redirect("/");
  }

  jwt.verify(req.cookies.jwt, CONFIG.JWTsecret, function(err, decoded) { 
  if (err) res.redirect('/'); // Manage different errors here (Expired, untrusted...)
  });

  oauth2Client.credentials =  jwt.verify(req.cookies.jwt, CONFIG.JWTsecret);
}

function decodeEntities(encodedString) { //Search Title Decode
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}


// Listen on the port defined in the config file
app.listen(CONFIG.port, function() {
  console.log(`Listening on port ${CONFIG.port}`);
});