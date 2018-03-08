# How-to Build an Intelligent Kiosk #

## Introduction ##

The Intelligent Kiosk Sample is a demo showcasing the visual retail scenario built on top of Intel® hardware and software optimizations.
This is a kiosk application where people can search for products using search box or using voice commands. When nobody is close to kiosk, it automatically launches an advertisement using Intel® Media Server Studio. It detects the presence of people using the Intel® Computer Vision SDK. It also has an amazing feature called face recognition which will recognize and keep track of what people are searching for. If they don’t find the product in the search, it will remember what they have searched for. The next time the customer visits, the inventory will be checked and the auto search will show the matching products, as well as asking:  “Are you still interested in buying these products?”.

## Hardware requirements ##

- 6th Generation Intel® Core™ processor or newer or Intel® Xeon® processor v4 or v5 with Intel® Graphics Technology (if enabled by OEM in BIOS and motherboard) [tested on NUC6i7KYK]
- USB Webcam [tested with Logitech* C922x Pro Stream]

## Software requirements ##

- Ubuntu* 16.04
- [Intel® Media Server Studio](https://software.intel.com/en-us/intel-media-server-studio)
- [Intel® CV SDK Beta R3](https://software.intel.com/en-us/cvsdk-quickstartguide)
- [Electron](https://electronjs.org/)

## Installation ##

Update NPM and Node.js\* to get Electron to work properly. Refer http://www.hostingadvice.com/how-to/update-node-js-latest-version/
and https://www.techiediaries.com/electron-data-persistence/

1. Update Ubuntu (don't upgrade): 
```
sudo apt get update
```
2. Install Node.js Package Manager: 
```
sudo apt install npm
```
3. Update [NodeJS](https://nodejs.org/en/download/package-manager/)
```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash - sudo apt-get install -y nodejs
```
4. Install [Electron](https://www.npmjs.com/package/electron):  
```
sudo npm install -g electron --unsafe-perm=true --allow-root
```
5. Install Mongo DB Server: 
```
sudo apt install mongodb-server
```
6. Install (Microsoft* Code)[https://code.visualstudio.com/download] (dev machine only)
7. Install git: 
```
sudo apt-get install git
```
8. Install latest Intel® CV SDK: https://software.intel.com/en-us/cvsdk-installguide. 
9. Install Gstreamer Library and MQTT broker: sudo apt-get install libgstreamer0.10-dev mosquitto

## Running the Sample ##

1. Open the directory where the intelligentkiosk application is downloaded.
2. Run the solution by typing: electron
3. Explore the scenarios.

## Troubleshooting ##

**Error -** MQTT NOT started: have you set the ENV varables?

**Fix -**
```
export MQTT_SERVER=localhost:1883
export MQTT_CLIENT_ID=cvservicenew
```
