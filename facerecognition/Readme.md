# IoT Reference Implementation: How-to Build a Face Access Control Solution
## Introduction

The [Face Access Control application](https://github.com/intel-iot-devkit/reference-implementation/edit/master/face-access-control/) is one of a series of IoT reference implementations aimed at instructing users on how todevelop a working solution for a particular problem. The solution uses facial recognition as the basis of a control systemfor granting physical access. The application detects and registers the image of a person’s face into a database, recognizesknown users entering a designated area and grants access if a person’s face matches an image in the database.

From this reference implementation, developers will learn to build and run an application that: 
* Detects and registers the image of a person’s face into a database 
* Recognizes known users entering a designated area 
* Grants access if a person’s face matches an image in the database

## How it Works
The Face Access Control system consists of two main subsystems:

### cvservicenew 
[cvservicenew](./cvservice/build/cvservicenew) is a C++ application that uses the Intel® Computer Vision SDK (Intel® CV SDK). It connects to a   USB camera (for detecting faces) and then performs facial recognition based on a training data file of authorized users to   determine if a detected person is a known user or previously unknown. Messages are published to a MQTT\* broker when users   are recognized and the processed output frames are written to stdout in raw format (to be piped to ffmpeg for compression   and streaming). Here, the Photography Vision Library is used for facial detection and recognition.

## Hardware requirements
* 6th Generation Intel® Core™ processor or newer *or* Intel® Xeon® v4, or Intel® Xeon® v6 Processors with Intel® Graphics Technology (if enabled by OEM in BIOS and motherboard)[[tested on NUC6i7KYK](https://www.intel.com/content/www/us/en/products/boards-kits/nuc/kits/nuc6i7kyk.html)] 

* USB Webcam [tested with Logitech\* C922x Pro Stream]

## Software requirements
 * Ubuntu\* 16.04 * [Intel® CV SDK Beta](https://software.intel.com/en-us/computer-vision-sdk)

## How to set up
### Intel® CV SDK
#### Download and install OpenCL\*
The Intel® CV SDK requires OpenCL\*, which is available as a separate download. We provide a script that helps withthe installation process [here](https://software.intel.com/file/593325/download). Unpack the archive using:

    tar xf install_OCL_driver2_sh.tgz

Then prepare a temporary workspace and run the script:

    mkdir opencl-temp    ./install_OCL_driver2.sh install --workspace opencl-temp

For this application you do not need to recompile the Linux\* kernel thus answer **no** when asked during the installation process.Additional details and instructions are provided in [this article](https://software.intel.com/articles/sdk-for-opencl-gsg).The System Analyzer Utility mentioned in the article can be use to confirm proper installation.

#### Download and Install the Intel® CV SDK
The guide for installing the Intel® CV SDK is offered [here](https://software.intel.com/en-us/cvsdk-quickstartguide-installing-intel-computer-vision-sdk).After completing the registration, download the archive for Ubuntu\*, unpack it, and run the GUI installer:

    tar xaf intel_cv_sdk_ubuntu_<version>.tgz    cd intel_cv_sdk_ubuntu_<version>    ./install_GUI.sh

When prompted, install as the root user or as a user with root permissions. The rest of the guide assumes you will install theIntel® CV SDK under the default location.
After installation, don't forget to source the CV SDK environment variables:

    source /opt/intel/computer_vision_sdk_<version>/bin/setupvars.sh

This will be required for building and running cvservicenew.To automate this process, you can source the script from `.profile` or `.bashrc`. Alternatively, you can add the variables to`/etc/environment`.

### cvservicenew
#### Install Paho\* MQTT\* C client libraries dependencies
This reference implementation uses MQTT to send data between services. To install the dependencies:

    sudo apt update    sudo apt install libssl-dev

Building the executable (from cvservice directory):

    mkdir build    cd build    cmake ..    make

## Running the application
From the `cvservice/build` directory start cvservicenew:

        ./cvservicenew
