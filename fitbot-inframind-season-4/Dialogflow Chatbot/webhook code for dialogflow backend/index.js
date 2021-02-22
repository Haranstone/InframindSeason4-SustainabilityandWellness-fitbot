// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const fetch = require('request-promise-native');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://YOUR CREDENTIALS.yhuli.mongodb.net";//add your mongoDB url
const { Payload } = require("dialogflow-fulfillment");
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'YOUR URL',
});

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
process.env.SENDGRID_API_KEY = 'YOUR key';//add your key

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 //welcome chatbot function
  function welcome(agent) {
    agent.add('welcome to Fit Bot, please enter your unique encoded Id on the chat.'); 
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  //get encodedID chatbot fuunction 
  function encodedIdHandler(agent){
  var encodedId = agent.parameters.encodedId;
   //var haran = "hariharan"; 
    var query = {UniqueId: encodedId};
return MongoClient.connect(url,{ useUnifiedTopology: true })
  .then(function (client) {
    //db.close();
    return client.db('FitbitDB');
  }).then(function (db) {
    return db.collection('fitbit');
  }).then(function (collection) {
    return collection.find(query).toArray();
  }).then(function (path) {
    //conv.ask(path);
    console.log(path[0].FirstName);
   var token = path[0].AccessToken;
  var fName = path[0].FirstName;
  //agent.add(path[0].FirstName);
  {agent.add("Hello "+fName+" you're successfully verified now. choose one of the options below:");
  agent.context.set({
                  name: 'encodedid-followup',
                  lifespan: 100,
                  parameters:{accessToken: token}
                });
 agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Fitbit Profile",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "BMI",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Calories Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Heart Rate",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Sleep Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
  }
  });
  }
  //get fitbit profile chatbot function
  function fitbitProfileHandler(agent){
  const contexts = agent.context.get('encodedid-followup');
    //const encodedId_passed = contexts.parameters.encodedIds;
    //const userName = contexts.parameters.names;
    const accessTokens = contexts.parameters.accessToken;
     return fetch('https://api.fitbit.com/1/user/-/profile.json',{
        headers: {
            'Authorization': 'Bearer '+accessTokens
        }
    }).then(result => { // Extract relevant details from data. 
        var str = JSON.parse(result); 
       var imageUrl = str.user.avatar640;
        var country = str.user.country;
        var gender  = str.user.gender;
        var fullName = str.user.fullName;
        var aboutUser = str.user.aboutMe;
        var userHeight = str.user.height;
        var userWeight = str.user.weight;
        var userAge = str.user.age;
        var userDOB = str.user.dateOfBirth;
      var profileResult = "Name: "+ fullName +"\nAge: "+userAge+"\nHeight: "+userHeight+" cm\nWeight: "+userWeight+" Kgs\nGender: "+gender+"\nAbout Me: "+aboutUser;
      console.log(profileResult);
        console.log(str.user.fullName);
      //agent.add(str.user.fullName);
       agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "image",
        "rawUrl": imageUrl,
        "accessibilityText": "Dialogflow across platforms"
      },
      {
        "type": "info",
        "title": "Fitbit Profile",
        "subtitle": profileResult,
        //"actionLink": ""
      },
      {
        "type": "chips",
        "options": [
          {
            "text": "BMI",
            //"link": ""
          },
          {
            "text": "Calories Logs",
            //"link": ""
          },
            {
            "text": "Heart Rate",
            //"link": ""
          },
          {
            "text": "Sleep Logs",
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
    })
     .catch(err=>{
      console.log(err);
    });
  }
  //get BMI value from fitbit web api through chatbot function
 function BMIHandler(agent){
   const contexts = agent.context.get('encodedid-followup');
   const accessTokens = contexts.parameters.accessToken;
       return fetch('https://api.fitbit.com/1/user/-/body/bmi/date/today/today.json',{
          headers: {
            'accept': 'application/json',
              'Authorization': 'Bearer '+accessTokens
          }
      }).then(result => { // Extract relevant details from data. 
          var str = JSON.parse(result); 
          //console.log(str);
          var BMIRes = Math.round(str['body-bmi'][0].value);
          var bmiDate = str['body-bmi'][0].dateTime;
          var finalBmiResponse = "your BMI is " + BMIRes + " as of " + bmiDate;
          console.log(finalBmiResponse);
         agent.add(finalBmiResponse);
                   if ( BMIRes < 18) {
            var thin = "You got to eat you're too thin.";
                     agent.add(thin);
          } else if (BMIRes >= 20 && BMIRes <= 25) {
            var fit = "you're fit , keep it up";
            agent.add(fit);
          } else if(BMIRes >=26 && BMIRes <= 30) {
            var overweight ="you're BMI comes under overweight category. if you wish,ask 'diet plan' in the chat to follow.";
            agent.add(overweight);
          } else {
            var obese = "you're obese please do follow a diet plan. if you wish, ask 'diet plan' in the chat to follow.";
            agent.add(obese);
          }
          agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Fitbit Profile",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Calories Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Heart Rate",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Sleep Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Diet Plan",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
        //agent.add(str.user.fullName);
      })
       .catch(err=>{
        console.log(err);
      });
 } 
  //get calorie logs of your consumed food and it's nutitional value breakdown through this web  api call function
       function getNutrientsHandler(agent){
   const contexts = agent.context.get('encodedid-followup');
   const accessTokens = contexts.parameters.accessToken;
        //let date = agent.parameters.date;

        return fetch('https://api.fitbit.com/1/user/-/foods/log/date/today.json',{
            headers: {
              'accept': 'application/json',
                'Authorization': 'Bearer '+accessTokens
            }
        }).then(result => { // Extract relevant details from data. 
            var res = JSON.parse(result);
            var str = res.summary; 
            var calories= str.calories;
            var carbs = str.carbs;
            var fat = str.fat;
            var fiber = str.fiber;
            var protein = str.protein;
            var sodium = str.sodium;
            var water = str.water;
            var nutriResult = "Total number of calories you have consumed for today is "+calories+", and here is the breakdown of it's nutritional values: \n\nthe total carbs is "+carbs+", \nthe total fat is "+fat+", \nthe total fiber is "+fiber+", \nthe total protein is "+protein+",\nthe total sodium is "+sodium+ ", \n\nand the total water you have consumed is "+water+" ml.";
            console.log(nutriResult);
          agent.add(nutriResult);
           agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Fitbit Profile",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "BMI",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Heart Rate",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Sleep Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
          //agent.add(str.user.fullName);
        })
         .catch(err=>{
          console.log(err);
        });
        }
  //get heart rate and BPM rate of the user from fitbit web api call function
 function getHeartRateHandler(agent){
   const contexts = agent.context.get('encodedid-followup');
   const accessTokens = contexts.parameters.accessToken;
          //let date ='today';
          return fetch('https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1min.json',{
              headers: {
                'accept': 'application/json',
                  'Authorization': 'Bearer '+accessTokens
              }
          }).then(result => { // Extract relevant details from data. 
              var res = JSON.parse(result);
              var restingBPM = res['activities-heart'][0]['value']['restingHeartRate'];
              var restingZone = res['activities-heart'][0]['value']['heartRateZones'][0];
              var restingZoneCal = res['activities-heart'][0]['value'];
              var restingZoneJsonCal = restingZone.caloriesOut;
              var restingZoneJsonMax = restingZone.max;
              var restingZoneJsonMin = restingZone.min;
              var restingZoneJsonMinutes = restingZone.minutes;
              var fatBurnZone = res['activities-heart'][0]['value']['heartRateZones'][1];
              var fatBurnZoneJsonCal = fatBurnZone.caloriesOut;
              var fatBurnZoneJsonMax = fatBurnZone.max;
              var fatBurnZoneJsonMin = fatBurnZone.min;
              var fatBurnZoneJsonMinutes = fatBurnZone.minutes;
              
              var restingZoneResult = "In your Resting Heart rate state you have spend "+Math.round(restingZoneJsonCal)+" calories."+"\nthe maximum heart rate went up to "+restingZoneJsonMax+"\nand the minimum heart rate drops down to "+restingZoneJsonMin;
              var fatBurnZoneResult = "In your Fat burn Heart rate state you have spend "+Math.round(fatBurnZoneJsonCal)+" calories."+"\nthe maximum heart rate went up to "+fatBurnZoneJsonMax+"\nand the minimum heart rate drops down to "+fatBurnZoneJsonMin;
             var finalHeartRes = restingZoneResult+"\n\n"+fatBurnZoneResult;
            var BPM = restingBPM;
              if ( BPM < 80) {
                agent.add(BPM +" You're Blood presure is normal.");
                console.log(BPM +" You're Blood presure is normal.");
              } else if (BPM >= 80 && BPM <= 89) {
                agent.add(BPM+" you're blood pressure is high you are in Hypertension stage 1 keep calm to control your Blood pressure.");
                console.log(BPM+" you're blood pressure is high you are in Hypertension stage 1 keep calm to control your Blood pressure.");
              } else if(BPM >=90 && BPM <= 100) {
                agent.add(BPM +" you're blood pressure is high you are in Hypertension stage 2, keep calm and take deep breathes.");
                console.log(BPM +" you're blood pressure is high you are in Hypertension stage 2, keep calm and take deep breathes.");
              } else {
                agent.add('please immediately consult a doctor right away. call on : 108');
                console.log('please immediately consult a doctor right away. call on : 108');
              }
              //console.log(finalHeartRes);
            agent.add(finalHeartRes);
             agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Fitbit Profile",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "BMI",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Calories Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Sleep Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
              //console.log(result);
              //console.log(restingZoneJson);
            //agent.add(str.user.fullName);
          })
           .catch(err=>{
            console.log(err);
          });
          }
  //get sleep logs of an user using this function 
  function getSleepHandler(agent){
       const contexts = agent.context.get('encodedid-followup');
   const accessTokens = contexts.parameters.accessToken;
                let date = '2021-02-19';
              return fetch('https://api.fitbit.com/1.2/user/-/sleep/date/'+date+'.json',{
                  headers: {
                    'accept': 'application/json',
                      'Authorization': 'Bearer '+accessTokens
                  }
              }).then(result => { // Extract relevant details from data. 
                  var str = JSON.parse(result); 
                  var sleepScore = str.sleep[0].efficiency;
                  var deepStage = str.summary.stages.deep;
                  var lightStage = str.summary.stages.light;
                  var remStage = str.summary.stages.rem;
                  var totalLengthStage = str.summary.totalMinutesAsleep;
                  var totalBedStage = str.summary.totalTimeInBed;
                  //console.log(str.summary);
                  var n = totalLengthStage;
                  var num = n;
            var hours = (num / 60);
            var rhours = Math.floor(hours);
            var minutes = (hours - rhours) * 60;
            var rminutes = Math.round(minutes);
                //this below code part is for total time spend on bed.
            var totalBedNum = totalBedStage;
      var totalBedHours = (totalBedNum/ 60);
      var totalBedRhours = Math.floor(totalBedHours);
      var totalBedMinutes = (totalBedHours - totalBedRhours) * 60;
      var totalBedRminutes = Math.round(totalBedMinutes);
      //var totalBedTime = totalBedStage;
            var asleepMessage = "you slept for "+rhours + " hour's and " + rminutes + " minutes only.";
            var totalBedTimeLog = "You were totally "+totalBedRhours + " hour's and " + totalBedRminutes + " minute's in bed,";
          var finalSleepResults =totalBedTimeLog+" and " +asleepMessage;
                 var detailedSleepLog = "you're total sleep score is "+sleepScore+"\n\ndetailed sleep log in mins:\nDeep Stage: "+deepStage+" mins\nLight Stage: "+lightStage+" mins\nVivid dream stage: "+ remStage+" mins";
          console.log(finalSleepResults);
                agent.add(finalSleepResults);
                agent.add(detailedSleepLog);
                 agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Fitbit Profile",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "BMI",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Calories Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Heart Rate",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Sleep Guide",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
          //console.log(sleepScore);
            //console.log(totalLengthStage);
                  //var sleepResult = "You have spend "+totalLengthStage+
                //agent.add(str.user.fullName);
              })
               .catch(err=>{
                console.log(err);
              });
              }
  //get desired diet plan for the user
  function getDietPlanHandler(agent){
  agent.add("Great now you're one step closer to your fitness goal, please choose a plan below :");
  agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Weight Loss",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Weight Gain",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Strenghten Plan",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
  }
  //weight loss plan handler function to send email the plan to the user mail ID
 function getWeightLossPlanHandler(agent){
     sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  var email = agent.parameters.email;

const  msg = {
  to: email,
  from: 'botcorpindia@gmail.com',
  subject: 'Weight Loss Plan From FitBot',
  text: "Dear User, \n\nWelcome to this Plan. \n\nIt is specifically designed for people who want to loss weight through proper diet and  training excercises.",
  html: '<p>Dear User, <br>Welcome to this Plan. <br>It is specifically designed for people who want to loss weight through proper diet and  training excercises.</p><br><br><a href="https://firebasestorage.googleapis.com/v0/b/freecoursesbot-kduyid.appspot.com/o/Weight_loss_strategies_that_really_work.pdf?alt=media&token=49625db7-1a77-4091-a31d-732ad09574db">click here to dowload the :<strong>Weight Loss Plan</strong></a>',
};
  
  console.log(msg);
  sgMail.send(msg);
   agent.add("Hooray ! we have sent your weight loss plan to your given mail ID. be sure to follow it.");
          agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Main Menu",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
); 
  //agent.add('email sent');
 } 
  //weight gain plan handler function to send email the plan to the user mail ID
  function getWeightGainPlanHandler(agent){
         sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  var email = agent.parameters.email;

const  msg = {
  to: email,
  from: 'botcorpindia@gmail.com',
  subject: 'Weight Gain Plan From FitBot',
  text:"Dear User, \n\nWelcome to this Plan. \n\nIt is specifically designed for people who want to gain weight through proper diet and excercises.",
  html: '<p>Dear User, <br>Welcome to this Plan. <br>It is specifically designed for people who want to gain weight through proper diet and excercises.</p><br><br><a href="https://firebasestorage.googleapis.com/v0/b/freecoursesbot-kduyid.appspot.com/o/weight-gain-plan-fitbit.pdf?alt=media&token=0465747f-b782-4dd3-b214-42d72a85a465">click here to dowload the :<strong>Weight Gain Plan</strong></a>',
};
  
  console.log(msg);
  sgMail.send(msg);
   agent.add("Hooray ! we have sent your weight gain plan to your given mail ID. be sure to follow it.");
       agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Main Menu",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
); 
 }  
  //strengthen plan handler function to send email the plan to the user mail ID
   function getStrenghthenPlanHandler(agent){
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  var email = agent.parameters.email;

const  msg = {
  to: email,
  from: 'botcorpindia@gmail.com',
  subject: 'Strengthen Plan From FitBot',
  text: "Dear User, \n\nWelcome to this Plan. \n\nIt is specifically designed for people who want to strenghten their muscles through hardcore training excercises.",
  html: '<p>Dear User, <br>Welcome to this Plan. <br>It is specifically designed for people who want to strenghten their muscles through hardcore training excercises.<p><br><br><a href="https://firebasestorage.googleapis.com/v0/b/freecoursesbot-kduyid.appspot.com/o/strengthen-exercises-fitbit.pdf?alt=media&token=f1d263e3-a1e7-4bcd-82e7-ba9b24b2153f">click here to dowload the :<strong>Strengthen Plan</strong></a>',
};
  
  console.log(msg);
  sgMail.send(msg);
   agent.add("Hooray ! we have sent your strengthen plan to your given mail ID. be sure to follow it.");
   agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Main Menu",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Bye",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);  
 } 
  
function getEmailHandler(agent){
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  var email = agent.parameters.email;

const  msg = {
  to: email,
  from: 'botcorpindia@gmail.com',
  subject: 'event',
  text: 'Dear Haran',
  html: '<br><strong>Hello</strong><br>',
};
  
  console.log(msg);
  sgMail.send(msg);
  agent.add('email sent');
/*sgMail.send(msg).then(() => {
  console.log('email sent');
  agent.add('email sent');
  
}).catch((error) => {
  console.log('error', error);
});*/
 } 
  
  //main menu handler function to route the user back to the start in the chatbot
 function mainMenuHandler(agent){
      //const contexts = agent.context.get('encodedid-followup');
   //const accessTokens = contexts.parameters.accessToken;
 agent.add('Welcome again please choose an option below');
   agent.add(
  new Payload(agent.UNSPECIFIED,{
  "richContent": [
    [
      {
        "type": "chips",
        "options": [
          {
            "text": "Fitbit Profile",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "BMI",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Calories Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Heart Rate",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          },
          {
            "text": "Sleep Logs",
            "image": {
              "src": {
                "rawUrl": ""
              }
            },
            //"link": ""
          }
        ]
      }
    ]
  ]
} , {rawPayload: true, sendAsMessage: true})
);
 } 
  
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  //intentMap.set('Language', languageHandler);
  //intentMap.set('Language - custom', languageCustomHandler);
  intentMap.set('getEncodedId', encodedIdHandler);
  intentMap.set('getBMI', BMIHandler);
  intentMap.set('getFitbitProfile', fitbitProfileHandler);
   intentMap.set('getCalories', getNutrientsHandler);
  intentMap.set('getHeartRate', getHeartRateHandler);
  intentMap.set('getSleepLogs', getSleepHandler);
  intentMap.set('getEmail', getEmailHandler);
  intentMap.set('getDietPlan', getDietPlanHandler);
  intentMap.set('getWeightGainPlan', getWeightGainPlanHandler);
   intentMap.set('getWeightLossPlan', getWeightLossPlanHandler);
   intentMap.set('getStrengthenPlan', getStrenghthenPlanHandler);
   intentMap.set('getMainMenu', mainMenuHandler);
  //intentMap.set('getProfile', getProfileHandler);
  //intentMap.set('getMongo', mongoHandler);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  //intentMap.set('test', testHandler);
  agent.handleRequest(intentMap);
});
