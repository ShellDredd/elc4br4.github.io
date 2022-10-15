---
layout      : post
title       : "Export Forensic Challenge - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Export-HackTheBox/Export-Challenge.webp
category    : [ htb ]
tags        : [ Forense ]
---

Esta vez estoy ante un challenge forense bastante chulo para quien comience en el Análisis Forense, analizaremos un archivo .raw de una captura de memoria de un sistema Windows, listaremos procesos, analizaremos los mismos, tendremos un poco de criptografía a nivel muy básico y finalizaremos obteniendo la flag de un script powershell...

![](/assets/images/HTB/Export-HackTheBox/export-rating.webp)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

```text
# CHALLENGE DESCRIPTION

We spotted a suspicious connection to one of our servers, and immediately took a memory dump. Can you figure out what the attackers were up to?
```

***


**Un pequeño INDICE**

1. [Volcado de Memoria RAM](#volcado).
2. [Requerimientos](#requerimientos).
3. [Anáisis del memory dump](#memory).


***

# Volcado de Memoria RAM [#](volcado) {#volcado}


En un análisis forense es de vital importancia conseguir una copia exacta del sistema que se vaya analizar.

Como la memoria RAM es volátil y si se apaga el equipo, la información que contiene se pierde. Debido a esto, en una investigación, si el equipo está encendido, es posible llevar a cabo el análisis en vivo, pero también existe otra manera: a través de la obtención del volcado de memoria (memory dump) donde se copia en un archivo el contenido de toda la memoria en un momento determinado. De esta manera es posible realizar el análisis post mortem, con una réplica exacta o “imagen forense” de la memoria del equipo en cuestión.

Tenemos un archivo raw, por lo tanto estamos ante un análisis de memoria volatil, de la memoria ram.


# Requerimientos [#](requerimientos) {#requerimientos}

Para esta ocasión lo mejor es usar la herramienta volatility, que en mi caso la estoy usando a través de la distribución Linux Ubuntu forense SANS SIFT.

Se puede descargar la distribución Forense SANS SIFT desde este enlace:

![](/assets/images/HTB/Export-HackTheBox/SIFT.webp)

[https://www.sans.org/tools/sift-workstation/](https://www.sans.org/tools/sift-workstation/)

Para comenzar a resolver el challenge necesitamos varias cosas:

1. Herramienta Volatility instalada
2. Volatility CheatSheet SANS SIFT 

Una vez tenemos todo comenzamos.


# Anáisis del memory dump [#](memory) {#memory}

Comenzamos intentando obtener algo de información básica del sistema del cual se ha realizado el dumpeo de memoria.

![](/assets/images/HTB/Export-HackTheBox/imageinfo.webp)

```bash
# Lanzamos el comando
---------------------
$ vol.py -f WIN-LQS146OE2S1-20201027-142607.raw imageinfo 
```

Vemos que el archivo de memoria sale de una máquina Windows 7 SPI de 64bits.
`Win7SP1x64`

Por lo tanto ahora añadiremos un parámetro más al comando en todos los que lancemos.

Sigo la metodología de análisis que me muestra la cheatsheet de SANS SIFT sobre el análisis de memoria.

![](/assets/images/HTB/Export-HackTheBox/metodología.webp)

Por lo tanto vamos a identiificar procesos ejecutados, maliciosos o no, a través del plugin pslist.

```bash
# El comando usado es el siguiente:
-----------------------------------
$ vol.py -f WIN-LQS146OE2S1-20201027-142607.raw --profile=Win7SP1x64 pslist
```

Y volatility nos saca una lista de todos los procesos, con su PID, fecha y hora de inicio, sesión activa... etc

![](/assets/images/HTB/Export-HackTheBox/pslist.webp)

Si nos fijamos hay varios procesos que estaban activos en el momento de la captura de memoria.

Tras ir analizandolos, tiro por analizar el proceso cmd.exe.

```bash
# El comando para analizar el proceso cmd.exe
---------------------------------------------
$ vol.py -f WIN-LQS146OE2S1-20201027-142607.raw --profile=Win7SP1x64 cmdscan
```

![](/assets/images/HTB/Export-HackTheBox/cmdscan.webp)

```powershell
# Si nos fijamos podemos ver que se descarga un script .ps1 (powershell) y se almacena en la ruta:
--------------------------------------------------------------------------------------------------
C:\Users\user\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\3usy12fv.ps1
```

Al almacenarse en la carpeta Startup, esto hace que cada vez que se inicie el sistema se ejecute el script 3usy12fv.ps1, es un método de persistencia.

También cabe destacar que la url desde donde se descarga el script .ps1 está codificado, y debemos decodificarlo.

Parece que está url-encodeado, asique voy a decodificarlo.

![](/assets/images/HTB/Export-HackTheBox/urlencode.webp)

```bash
# URL-DECODIFICADA
------------------
http://bit.ly/SFRCe1cxTmQwd3NfZjByM05zMUNTXzNIP30=.ps1
```

Si nos fijamos de nuevo en la URL ya decodificada, el nombre del script .ps1 parece estar encodeado también pero en base64, por lo tanto voy a desencodearlo.

![](/assets/images/HTB/Export-HackTheBox/flag.webp)

![](/assets/images/HTB/Export-HackTheBox/share.webp)