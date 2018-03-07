# Amazon Alexa* Speech to Text (STT) with Web app Integration

#### 1.	Create an account at https://developer.amazon.com/ and sign in

#### 2.	Navigate to the Developer Console from the menu near to top right of the page.

#### 3.	Create a LWA Security Profile: 

  a.	Click on “Apps & Services”, then “Login with Amazon.
  
  b.	Click on “Create a New Security Profile”.
  
![Image of Create a New Security Profile](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa1.jpg)
  
  c.	Allowed Origins should have the https protocol, IP address, as well as localhost of the system with required port number from which the application is intended to be launched. E.g., https://192.168.11.15:9745 and https://localhost:9745

  d.	Allow Return URLs to be in https with IP address as well as localhost and port followed by code and authresponse as two separate entries. E.g., https://192.168.11.15:9745/code, https://192.168.11.15:9745/authresponse, https://localhost:9745/code and https://localhost:9745/authresponse

  e.	Fill in all three required fields to create your security profile and click “Save”. For the purpose of this article, I am using the Amazon* privacy policy URL. Make sure to replace the link with a link to your own Data Privacy policy.

![Image of Saving Security Profile](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa2.jpg)

  f.	Before you complete this step, be sure to copy your Client ID and Client Secret to a text editor so they're easily available. You’ll need these values later in the process.
  
![Image of ClientID and Client Secret](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa3.jpg)

#### 4.	Amazon* Lambda Development: -

  a.	Open the https://console.aws.amazon.com/lambda/home?region=us-east-1#/  

  b.	Login using the same Amazon account to which your Alexa device is linked (recommended) or create a new account. Note: - For Intel official accounts, one has to get approval for their Intel credentials and access Amazon from http://awslogin.intel.com/ . This will, in turn, open the Amazon console.

  c.	Type Lambda in the AWS Services textbox and open it.
  
![Image of Opening Lambda](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa4-new.jpg)

  d.	Create a new function.
  
![Image of Create new function](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa5.jpg)

  e.	Enter the name of your Lambda function. This name needs to be unique. For now, you can simply use “HelloWorld". In the top right, it should say “N. Virginia”. If that’s not the case, please select “US-East (N. Virginia)” from the dropdown menu.

  f.	Prepare the lambda code in JavaScript*, bundle it with required node modules, and upload the zip file to Function Code. (Attached zip file). Lambda function code inside index.js is as follows:

```javascript
'use strict';

const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
const APP_ID = 'amzn1.ask.skill.{***}-{***}'; // TODO replace with your app ID (OPTIONAL).

// IoT Config
const config = {
        "thingName": 'yourThingName', //Replace this
        "endpointAddress": "{****}.iot.us-east-1.amazonaws.com" // Replace this
};

var productStateRequest, productState, params;

//Alexa Config
const handlers = {
        'LaunchRequest': function() {
                this.emit('GetFact');
        },
        'GetNewFactIntent': function() {
                productStateRequest = this.event.request.intent.slots.product;
                if (productStateRequest) {
                        productState = productStateRequest.value;
                }

          params = {
                    topic: 'yourPolicyName', //replace this
                    payload: JSON.stringify(productState)
                   }

                this.emit(':tellWithCard', productState, 'visual retail', productState);
        },
        'AMAZON.HelpIntent': function() {
                this.emit(':ask', 'How can I help you?');
        },
        'AMAZON.CancelIntent': function() {
                this.emit(':tellWithCard', 'Goodbye!', 'visual retail', 'Goodbye!');
        },
        'AMAZON.StopIntent': function() {
                this.emit(':tell', 'Goodbye!', 'visual retail', 'Goodbye!');
        },
};

// --------------- Main handler -----------------------

exports.handler = function(event, context, callback) {
        console.log('Received event:', JSON.stringify(event, null, 2));

        var alexa = Alexa.handler(event, context);
        //alexa.APP_ID = APP_ID;
        alexa.appId = APP_ID;
        alexa.registerHandlers(handlers);
        console.log("HERE --->  " + event.request.intent.name);
        var tIntent = event.request.intent.name;
        var iotdata = new AWS.IotData({
                endpoint: config.endpointAddress
        });
        if (tIntent == 'LaunchRequest' || 'GetNewFactIntent') {
                console.log();
        const params = {
                  topic: 'yourPolicyName', //Replace this
                  payload: JSON.stringify(event.request.intent.slots.product.value)
                }

                iotdata.publish(params, (err, res) => {
                        if (err) return context.fail(err);

                        console.log(res);
                        alexa.execute();
                        return context.succeed(event);

                });
        }

};

```
  g.	Once you’ve created the function, click on the “Event Sources” tab. Then click the blue “Add event source” link, and select “Alexa Skills Kit” from the modal dropdown.

#### 5.	Alexa* Skills Development: -

  a.	Open the Amazon Developer Skills portal:- https://developer.amazon.com/edw/home.html#/skills/list

  b.	Click the yellow “Get Started >” button under “Alexa Skills Kit”. Then click the yellow “Add a New Skill” button on the next page.

![Image of ClientID and Client Secret](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa6-2.jpg)

  c.	The name of your Amazon Alexa skill must be unique for your account, and the invocation name is what you’ll use to activate the skill. “Alexa, Ask Intel for a {product}”. Note: - You can’t use an existing, published skill name.

  d.	If you can't think of anything else, no worries! You can use “Intel” as the invocation name. Click the yellow “Next” button when you’re ready!

![Image of ClientID and Client Secret](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa7.jpg)

  e.	Interaction Model: - This is where we tell the skill which intents we support and which words will trigger each intent. Get ready to copy-paste.

![Image of ClientID and Client Secret](https://github.com/SSG-DRD-IOT/intelligentkiosk/blob/master/web/images/Alexa8.jpg)

  f.	Copy and paste the following Intent Schema in the Code Editor. Replace the “invocation name” : “intel” with the name of the skill given in the previous step. 

```javascript
{
  "languageModel": {
    "types": [
      {
        "name": "AMAZON.SoftwareApplication",
        "values": [
          {
            "id": "1",
            "name": {
              "value": "vPro",
              "synonyms": []
            }
          },
          {
            "id": "4",
            "name": {
              "value": "NUC",
              "synonyms": []
            }
          },
          {
            "id": "3",
            "name": {
              "value": "Gateway",
              "synonyms": []
            }
          },
          {
            "id": "2",
            "name": {
              "value": "Movidius",
              "synonyms": []
            }
          }
        ]
      }
    ],
    "intents": [
      {
        "name": "AMAZON.CancelIntent",
        "samples": []
      },
      {
        "name": "AMAZON.HelpIntent",
        "samples": []
      },
      {
        "name": "AMAZON.StopIntent",
        "samples": []
      },
      {
        "name": "GetNewFactIntent",
        "samples": [
          "a {product}",
          "give me a {product}",
          "tell me {product}",
          "tell me a {product}",
          "give me {product}",
          "give me {product} information",
          "give me some {product}",
          "get {product}",
          "get me a {product}"
        ],
        "slots": [
          {
            "name": "product",
            "type": "AMAZON.SoftwareApplication"
          }
        ]
      }
    ],
    "invocationName": "intel"
  }
}
```

  g.	Click the Apply Changes button on the top right.

  h.	Click Save Model and Build Model from the menu near top left.

  i.	Navigate to Configuration on the top menu bar.

  j.	Configuration: - Change the radio button from “HTTPS” to “Lambda ARN”, and select the “No” radio button under "Account Linking". Now we’ll have to go and grab the Lambda Amazon Resource Name (ARN) from our Lambda tab. You still have that open, right?

  k.	The ARN is at the top right of the Lambda function page. I have it selected in the image above. You’ll want to copy the selection next to "ARN". This field looks somewhat like a source path.

  l.	Paste the ARN into the text field, and press “Next”. 

  m.	Amazon Skills Test: - After you click “Next” on the “Configuration” tab, you should be on the “Test” tab. Under the “Service Simulator” portion, you’ll be able to enter a sample utterance to trigger your skill. For the “Intel” example you should type something like “a product” On the right you should see the output from the Lambda function you created: “Product”.

#### 6.	Triggering a Lambda function from AWS* IOT:

  a.	AWS IOT Thing, Certificate and Policy are be created.

  b.	Create a Lambda function.

  c.	Create a rule to invoke a Lambda function.

  d.	Test it using the MQTT Client.

Details are as follows: 

* Create a new AWS IOT thing in https://console.aws.amazon.com/iot/home?region=us-east-1#/thinghub

*	Create a new Policy in https://console.aws.amazon.com/iot/home?region=us-east-1#/policyhub
E.g., MyIntelPolicy.

*	Then click on the created policy which gives details of the policy ARN. Copy the policy name from the end of the ARN and save it for further use.

*	Now test the topic from https://console.aws.amazon.com/iot/home?region=us-east-1#/test

*	Subscribe to a topic, and paste the policy name copied before (E.g., MyIntelPolicy). Click the Subscribe to topic button. Test this subscription by pasting the same policy name in publish textbox, enter the text to be published inside the JSON, and click Publish to topic. Observe the custom messages being displayed as soon as new value is published.

#### 7.	MQTT Explorer Browser Example Application
Follow the instructions from https://github.com/aws/aws-iot-device-sdk-js#browser

#### Conclusion: 

This example shows how to integrate an Amazon Alexa skill that acts like Text to Speech converter and integration into web applications.

### Troubleshooting

Error: Server Certificate not found

Fix: Set the full path of the directory for server.key and server.crt in the following code residing in server.js

```javascript
const options = {
  // Private Key
  key: fs.readFileSync('/home/intel/Downloads/intelligentkiosk/web/ssl/server.key'),

  // SSL Certficate
  cert: fs.readFileSync('/home/intel/Downloads/intelligentkiosk/web/ssl/server.crt'),

  // Make sure an error is not emitted on connection when the server certificate verification against the list of supplied CAs fails.
  rejectUnauthorized: false
};
```
