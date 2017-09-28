// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var superagent = require("superagent");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

//Get-Request auf QnA-Maker search_faq
app.get("/search_faq", function (request, response) {
  console.log('>>> FAQ Search Endpoint.')

  var query = request.query.search_query
  console.log("search_query = ", query)
  
//Response-Objekt Text fuer Chatfuel erstellen
  var make_text_message = (answer) => {
  var txt = answer.map((text) => {return {text: text}})
  return {
    messages: txt
  }
};
  
//Response-Objekt quickReply fuer Chatfuel erstellen
  var make_quickReply_message = (answer) => {
  var msg = {
    "messages": [
      {
        "text":  answer,
        "quick_replies": [
          {
            "title":"Google Hilft",
            "block_names":["Google"]
          },
        ]
      }
    ]
  }
  return msg
}
  
  
//Response-Objekt linkToBlock fuer Chatfuel erstellen
  var make_linkToBlock_message = (answer) => {
  var msg = {
  "redirect_to_blocks": ["Google"]
}
  return msg
}
  

//Funktion zum Aufruf von QnA-Maker
  superagent
  .post('https://westus.api.cognitive.microsoft.com/qnamaker/v2.0//knowledgebases/d71d3dc6-6294-4252-9b00-f8eff9575736/generateAnswer')
  .send({ question: query })
  .set('Ocp-Apim-Subscription-Key', process.env.QnA_Key)
  .set('Content-Type', 'application/json')
  .end(function(err, res){
    if (err || !res.ok) {
      response.send({answer: "Fehlermeldung: "+ err +", "+ JSON.stringify(res)});
      } else if (res.body.answers[0].answer =="No good match found in the KB"){
        
        
  //Aufruf des Google-Blocks in Chatfuel, wenn kein Eintrag in KB gefunden wird
        var msg = {
  "redirect_to_blocks": ["Google"]
         }
        response.send(msg)
        
  //Mögliche Rückgabe eines Quick-Reply Buttons in Chatfuel wenn kein Eintrag in KB gefunden wurde 
        // var answer = [res.body.answers[0].answer]
        //var textMessage = make_quickReply_message(answer)
        //var defaultanswer = "Leider gibt es dazu kein Eintrag in der FAQ"
        //textMessage.messages[0].text = defaultanswer
        //response.send(textMessage);  
        
      } else {

        // Umlaute korrekt darstellen
        const Entities = require('html-entities').AllHtmlEntities;
        const entities = new Entities();      
        
  //Logging für Testzwecke 
        //console.log("res.body =", res.body)
        //console.log("res.body.answers =", res.body.answers)
        var answer = [res.body.answers[0].answer]
        var textMessage = make_text_message(answer)
        //console.log('textMessage =', textMessage)
        var decodeTxt = entities.decode(textMessage.messages[0].text)
        textMessage.messages[0].text = decodeTxt
        console.log('decodeTxtMessage =', textMessage)
        response.send(textMessage);      
             }
  }
      )
})
// listen for requests 
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
