# ARTEMIX
is brought to you by Philippe Salome, Levan Loria and Michel Caillat.
Laboratoire d'Etudes du Rayonnement et de la Matière en Astrophysique,
Observatoire de Paris, 61 Avenue de l'Observatoire, 75014 Paris - France

Usage policy
The following statement should be included in the acknowledgment of papers using the ALMA datasets : 
This paper makes use of the following ALMA data: ADS/JAO.ALMA#201X.X.XXXXX.X. ALMA is a partnership of ESO (representing its member states), NSF (USA) and NINS (Japan), together with NRC (Canada) , NSC and ASIAA (Taiwan), and KASI (Republic of Korea), in cooperation with the Republic of Chile. The Joint ALMA Observatory is operated by ESO, AUI/NRAO and NAOJ. The National Radio Astronomy Observatory is a facility of the National Science Foundation operated under cooperative agreement by Associated Universities, Inc.

Please also add a reference to ARTEMIX :
The data were retrieved from ARTEMIX (http://artemix.obspm.fr) operated by the Observatoire de Paris/LERMA (Salome et al., 2017ASPC..XXX..XXX). This portal gives access to the ALMA Fits files as produced by the ALMA QA2 and extracted from the ALMA archive. ARTEMIX provides a quick look access to the ALMA datacubes as well as a synthetic view of the observation and imaging parameters (positions / frequencies).

#!/bin/bash

# Simple script for installing ZeroRPC on Ubuntu

# System dependencies

# First install ZeroMQ
sudo apt-get install libzmq-dev

# Next install libevent, an event notification library required by zerorpc
sudo apt-get install libevent

# Python dependencies

# Now install pyzmq: Python bindings for ZeroMQ
# If you don't already have pip installed:
sudo apt-get install python-setuptools
sudo apt-get install python-pip
sudo pip install pyzmq

# Now we can install ZeroRPC
sudo pip install zerorpc

# Node.js dependencies

# Just install the ZeroRPC node module
sudo npm install -g zerorpc
