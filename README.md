# Web-Interface for RGBWW-Controller

This project hosts a designated Web Interface that interacts with the [RGBWW Controller Firmware](https://github.com/patrickjahns/esp_rgbww_firmware).
The aim of this project is to provide a simple and easy to use interface for setup and configuration of the controller.
It is not meant to be used as everyday interface and does not replace a designated integration with common HomeAutomation Tools (i.e. FHEM, OpenHab etc.).


The WebInterface is build using [Angular 1.x](https://github.com/angular/angular.js), [Angular Material](https://material.angularjs.org/latest/)
and also utilizes a customized form of [md-color-picker](https://github.com/brianpkelley/md-color-picker).

## Screenshots

## Build instructions

Building the final version of the files is done with:
- npm (Node Package Manager)
- bower
- grunt

All dependencies can be installed via `npm run init`.
Building the distribution files is easily done by running `npm run release`.

